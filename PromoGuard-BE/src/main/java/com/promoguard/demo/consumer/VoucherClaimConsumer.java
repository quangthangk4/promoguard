package com.promoguard.demo.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.promoguard.demo.dto.event.VoucherClaimedEvent;
import com.promoguard.demo.repository.CampaignsRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class VoucherClaimConsumer {

  private static final Logger log = LoggerFactory.getLogger(VoucherClaimConsumer.class);

  private final CampaignsRepository campaignsRepository;
  private final ObjectMapper objectMapper;

  public VoucherClaimConsumer(
      CampaignsRepository campaignsRepository
  ) {
    this.campaignsRepository = campaignsRepository;
    this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
  }

  @KafkaListener(topics = "voucher-claims", groupId = "promoguard-group")
  @Transactional
  public void consume(String payload) {
    log.info("Received voucher claim event from Kafka: {}", payload);
    try {
      VoucherClaimedEvent event = objectMapper.readValue(payload, VoucherClaimedEvent.class);

      // 1. Decrement stock in DB
      boolean stockDecremented = campaignsRepository.decrementStock(event.campaignId());
      if (!stockDecremented) {
        log.warn("Stock already 0 in database for campaign {}, claim event ignored.", event.campaignId());
      }

      // 2. Create claim in DB
      try {
        campaignsRepository.createClaim(event.campaignId(), event.userId());
      } catch (DuplicateKeyException e) {
        log.warn("Duplicate claim event detected in database for campaign {} and user {}, ignoring.", event.campaignId(), event.userId());
        if (stockDecremented) {
          campaignsRepository.incrementStock(event.campaignId());
        }
        return; // Idempotent success (avoid double insert and double decrement)
      }

      log.info("Successfully recorded voucher claim for user {} and campaign {} in DB", event.userId(), event.campaignId());
      
    } catch (Exception e) {
      log.error("Error processing claim event: {}", e.getMessage(), e);
      throw new RuntimeException("Error processing claim event, retrying...", e); // Throwing error triggers Kafka retry
    }
  }
}
