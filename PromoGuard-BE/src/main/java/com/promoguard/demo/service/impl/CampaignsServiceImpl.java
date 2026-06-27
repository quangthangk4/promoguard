package com.promoguard.demo.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.promoguard.demo.domain.CampaignStatus;
import com.promoguard.demo.domain.ClaimResult;
import com.promoguard.demo.dto.event.VoucherClaimedEvent;
import com.promoguard.demo.dto.request.CreateCampaignRequest;
import com.promoguard.demo.dto.request.UpdateCampaignRequest;
import com.promoguard.demo.dto.response.AdminClaimResponse;
import com.promoguard.demo.dto.response.CampaignResponse;
import com.promoguard.demo.dto.response.CampaignStatsResponse;
import com.promoguard.demo.dto.response.ClaimResponse;
import com.promoguard.demo.dto.response.UserClaimResponse;
import com.promoguard.demo.exception.ClaimException;
import com.promoguard.demo.exception.ResourceNotFoundException;
import com.promoguard.demo.port.CurrentUserPort;
import com.promoguard.demo.repository.CampaignsRepository;
import com.promoguard.demo.service.CampaignsService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampaignsServiceImpl implements CampaignsService {

  private static final Logger log = LoggerFactory.getLogger(CampaignsServiceImpl.class);

  private final CampaignsRepository campaignsRepository;
  private final CurrentUserPort currentUserPort;
  private final ObjectMapper objectMapper;
  private final StringRedisTemplate redisTemplate;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final java.util.Map<UUID, CampaignResponse> metadataLocalCache = new java.util.concurrent.ConcurrentHashMap<>();

  private static final String CLAIM_LUA_SCRIPT =
      "local stock_key = KEYS[1]\n" +
      "local claimed_key = KEYS[2]\n" +
      "local user_id = ARGV[1]\n" +
      "local initial_stock = tonumber(ARGV[2])\n" +
      "\n" +
      "if redis.call('SISMEMBER', claimed_key, user_id) == 1 then\n" +
      "    return -1\n" +
      "end\n" +
      "\n" +
      "local stock = redis.call('GET', stock_key)\n" +
      "if not stock then\n" +
      "    redis.call('SET', stock_key, initial_stock)\n" +
      "    stock = initial_stock\n" +
      "else\n" +
      "    stock = tonumber(stock)\n" +
      "end\n" +
      "\n" +
      "if stock <= 0 then\n" +
      "    return -2\n" +
      "end\n" +
      "\n" +
      "redis.call('DECR', stock_key)\n" +
      "redis.call('SADD', claimed_key, user_id)\n" +
      "return 1";

  private static final String REVERT_LUA_SCRIPT =
      "local stock_key = KEYS[1]\n" +
      "local claimed_key = KEYS[2]\n" +
      "local user_id = ARGV[1]\n" +
      "\n" +
      "redis.call('INCR', stock_key)\n" +
      "redis.call('SREM', claimed_key, user_id)\n" +
      "return 1";

  private final RedisScript<Long> claimRedisScript = RedisScript.of(CLAIM_LUA_SCRIPT, Long.class);
  private final RedisScript<Long> revertRedisScript = RedisScript.of(REVERT_LUA_SCRIPT, Long.class);

  public CampaignsServiceImpl(
      CampaignsRepository campaignsRepository,
      CurrentUserPort currentUserPort,
      StringRedisTemplate redisTemplate,
      KafkaTemplate<String, String> kafkaTemplate
  ) {
    this.campaignsRepository = campaignsRepository;
    this.currentUserPort = currentUserPort;
    this.redisTemplate = redisTemplate;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
  }

  @Override
  public CampaignResponse createCampaign(CreateCampaignRequest request) {
    CampaignResponse response = campaignsRepository.create(request);
    if (response.status() == CampaignStatus.ACTIVE) {
      try {
        warmupCampaignCache(response.id(), response.remainingQuantity());
      } catch (Exception e) {
        log.error("Failed to warmup cache on campaign creation", e);
      }
    }
    return response;
  }

  @Override
  public ClaimResponse claimVoucher(UUID campaignId) {
    String metadataKey = "campaign:" + campaignId + ":metadata";
    String stockKey = "campaign:" + campaignId + ":stock";
    String claimedKey = "campaign:" + campaignId + ":claimed_users";

    // 1. Get campaign metadata from local cache, fallback to Redis/DB if missing
    CampaignResponse campaign = metadataLocalCache.get(campaignId);
    if (campaign == null) {
      try {
        String metadataJson = redisTemplate.opsForValue().get(metadataKey);
        if (metadataJson != null) {
          campaign = objectMapper.readValue(metadataJson, CampaignResponse.class);
        } else {
          campaign = campaignsRepository.findById(campaignId)
              .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));
          redisTemplate.opsForValue().set(metadataKey, objectMapper.writeValueAsString(campaign), 1, TimeUnit.HOURS);
        }
        metadataLocalCache.put(campaignId, campaign);
      } catch (ResourceNotFoundException e) {
        throw e;
      } catch (Exception e) {
        log.error("Error reading campaign metadata", e);
        // Fallback directly to DB if Redis metadata is erroring
        campaign = campaignsRepository.findById(campaignId)
            .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));
      }
    }

    // 2. Validate campaign active status and time window
    Instant now = Instant.now();
    if (campaign.status() != CampaignStatus.ACTIVE || now.isBefore(campaign.startTime()) || now.isAfter(campaign.endTime())) {
      throw new ClaimException(ClaimResult.CAMPAIGN_NOT_ACTIVE);
    }



    // 3. Perform atomic decrement and duplicate claim check in Redis via Lua Script
    UUID userId = currentUserPort.getUserId();
    Long result;
    try {
      result = redisTemplate.execute(
          claimRedisScript,
          List.of(stockKey, claimedKey),
          userId.toString(),
          String.valueOf(campaign.remainingQuantity())
      );
    } catch (Exception e) {
      log.error("Redis claim execution error", e);
      throw new RuntimeException("Hệ thống bận, vui lòng thử lại sau.", e);
    }

    if (result == null) {
      throw new RuntimeException("Hệ thống bận, vui lòng thử lại sau.");
    }

    if (result == -1) {
      throw new ClaimException(ClaimResult.ALREADY_CLAIMED);
    } else if (result == -2) {
      throw new ClaimException(ClaimResult.SOLD_OUT);
    }

    // 4. Publish claim event to Kafka asynchronously
    try {
      VoucherClaimedEvent event = new VoucherClaimedEvent(campaignId, userId, Instant.now());
      String payload = objectMapper.writeValueAsString(event);
      kafkaTemplate.send("voucher-claims", campaignId.toString(), payload)
          .whenComplete((res, ex) -> {
            if (ex != null) {
              log.error("Failed to publish claim event to Kafka, reverting Redis state. Error: {}", ex.getMessage());
              revertRedisClaim(campaignId, userId);
            }
          });
    } catch (Exception e) {
      log.error("Error preparing Kafka payload, reverting Redis state.", e);
      revertRedisClaim(campaignId, userId);
      throw new RuntimeException("Lỗi ghi nhận lượt claim, vui lòng thử lại.", e);
    }

    return ClaimResponse.of(ClaimResult.SUCCESS);
  }

  private void revertRedisClaim(UUID campaignId, UUID userId) {
    try {
      String stockKey = "campaign:" + campaignId + ":stock";
      String claimedKey = "campaign:" + campaignId + ":claimed_users";
      redisTemplate.execute(
          revertRedisScript,
          List.of(stockKey, claimedKey),
          userId.toString()
      );
    } catch (Exception e) {
      log.error("Failed to revert Redis claim state", e);
    }
  }

  private void warmupCampaignCache(UUID campaignId, int dbRemainingQuantity) {
    String stockKey = "campaign:" + campaignId + ":stock";
    String claimedKey = "campaign:" + campaignId + ":claimed_users";

    try {
      List<UUID> claimedUserIds = campaignsRepository.findClaimedUserIds(campaignId);
      redisTemplate.opsForValue().setIfAbsent(stockKey, String.valueOf(dbRemainingQuantity));

      if (!claimedUserIds.isEmpty()) {
        String[] userIds = claimedUserIds.stream().map(UUID::toString).toArray(String[]::new);
        redisTemplate.opsForSet().add(claimedKey, userIds);
      }
      log.info("Successfully warmed up Redis cache for campaign {}: stock={}, claimedUsersCount={}", 
          campaignId, dbRemainingQuantity, claimedUserIds.size());
    } catch (Exception e) {
      log.error("Failed to warmup Redis cache for campaign {}", campaignId, e);
    }
  }

  @Override
  public CampaignStatsResponse getCampaignStats(UUID campaignId) {
    return campaignsRepository.findStatsById(campaignId)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));
  }

  @Override
  public List<UserClaimResponse> getMyClaims() {
    UUID userId = currentUserPort.getUserId();
    return campaignsRepository.findClaimsByUserId(userId);
  }

  @Override
  public List<CampaignResponse> getCampaigns(CampaignStatus status, int limit, int offset) {
    return campaignsRepository.findAll(status, limit, offset);
  }

  @Override
  @Transactional
  public CampaignResponse updateCampaignStatus(UUID campaignId, CampaignStatus status) {
    CampaignResponse response = campaignsRepository.updateStatus(campaignId, status)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));

    // Evict cache and warm up if status is active
    try {
      String metadataKey = "campaign:" + campaignId + ":metadata";
      redisTemplate.delete(metadataKey);
      metadataLocalCache.remove(campaignId);
      if (status == CampaignStatus.ACTIVE) {
        warmupCampaignCache(campaignId, response.remainingQuantity());
      }
    } catch (Exception e) {
      log.error("Failed to update Redis cache on status change", e);
    }

    return response;
  }

  @Override
  public CampaignResponse getCampaignById(UUID campaignId) {
    return campaignsRepository.findById(campaignId)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));
  }

  @Override
  public List<AdminClaimResponse> getCampaignClaims(UUID campaignId, int limit, int offset) {
    if (campaignsRepository.findById(campaignId).isEmpty()) {
      throw new ResourceNotFoundException("Chiến dịch không tồn tại");
    }
    return campaignsRepository.findClaimsByCampaignId(campaignId, limit, offset);
  }

  @Override
  @Transactional
  public CampaignResponse updateCampaign(UUID campaignId, UpdateCampaignRequest request) {
    CampaignResponse existing = campaignsRepository.findById(campaignId)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));

    int claimedCount = existing.totalQuantity() - existing.remainingQuantity();
    if (request.totalQuantity() < claimedCount) {
      throw new IllegalArgumentException("Tổng số lượng không thể nhỏ hơn số lượng voucher đã được claim (" + claimedCount + ")");
    }

    CampaignResponse updated = campaignsRepository.updateCampaign(campaignId, request)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));

    // Evict cache to reload metadata and stock on next claim
    try {
      String metadataKey = "campaign:" + campaignId + ":metadata";
      String stockKey = "campaign:" + campaignId + ":stock";
      redisTemplate.delete(List.of(metadataKey, stockKey));
      metadataLocalCache.remove(campaignId);
    } catch (Exception e) {
      log.error("Failed to evict Redis cache on campaign update", e);
    }

    return updated;
  }

  @Override
  @Transactional
  public void deleteCampaign(UUID campaignId) {
    CampaignResponse campaign = campaignsRepository.findById(campaignId)
        .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch không tồn tại"));

    if (campaign.status() != CampaignStatus.DRAFT) {
      // Check if any voucher has been claimed (just in case status isn't DRAFT)
      int claimedCount = campaign.totalQuantity() - campaign.remainingQuantity();
      if (claimedCount > 0) {
        throw new IllegalArgumentException("Không thể xóa chiến dịch đã có người claim voucher");
      }
    }

    boolean deleted = campaignsRepository.deleteById(campaignId);
    if (!deleted) {
      throw new ResourceNotFoundException("Chiến dịch không tồn tại");
    }
  }

}
