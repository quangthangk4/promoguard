package com.promoguard.demo.repository;

import com.promoguard.demo.domain.CampaignStatus;
import com.promoguard.demo.dto.request.CreateCampaignRequest;
import com.promoguard.demo.dto.request.UpdateCampaignRequest;
import com.promoguard.demo.dto.response.AdminClaimResponse;
import com.promoguard.demo.dto.response.CampaignResponse;
import com.promoguard.demo.dto.response.CampaignStatsResponse;
import com.promoguard.demo.dto.response.UserClaimResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignsRepository {
  CampaignResponse create(CreateCampaignRequest request);
  Optional<CampaignResponse> findById(UUID id);
  Optional<CampaignStatsResponse> findStatsById(UUID id);
  boolean decrementStock(UUID id);
  void createClaim(UUID campaignId, UUID userId);
  List<UserClaimResponse> findClaimsByUserId(UUID userId);
  List<CampaignResponse> findAll(CampaignStatus status, int limit, int offset);
  Optional<CampaignResponse> updateStatus(UUID campaignId, CampaignStatus status);
  List<AdminClaimResponse> findClaimsByCampaignId(UUID campaignId, int limit, int offset);
  Optional<CampaignResponse> updateCampaign(UUID campaignId, UpdateCampaignRequest request);
  boolean deleteById(UUID campaignId);
  void incrementStock(UUID id);
  List<UUID> findClaimedUserIds(UUID campaignId);
}
