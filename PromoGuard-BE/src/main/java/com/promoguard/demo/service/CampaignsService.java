package com.promoguard.demo.service;

import com.promoguard.demo.domain.CampaignStatus;
import com.promoguard.demo.dto.request.CreateCampaignRequest;
import com.promoguard.demo.dto.request.UpdateCampaignRequest;
import com.promoguard.demo.dto.response.AdminClaimResponse;
import com.promoguard.demo.dto.response.CampaignResponse;
import com.promoguard.demo.dto.response.CampaignStatsResponse;
import com.promoguard.demo.dto.response.ClaimResponse;
import com.promoguard.demo.dto.response.UserClaimResponse;
import java.util.List;
import java.util.UUID;

public interface CampaignsService {
  CampaignResponse createCampaign(CreateCampaignRequest request);
  ClaimResponse claimVoucher(UUID campaignId);
  CampaignStatsResponse getCampaignStats(UUID campaignId);
  List<UserClaimResponse> getMyClaims();
  List<CampaignResponse> getCampaigns(CampaignStatus status, int limit, int offset);
  CampaignResponse updateCampaignStatus(UUID campaignId, CampaignStatus status);
  CampaignResponse getCampaignById(UUID campaignId);
  List<AdminClaimResponse> getCampaignClaims(UUID campaignId, int limit, int offset);
  CampaignResponse updateCampaign(UUID campaignId, UpdateCampaignRequest request);
  void deleteCampaign(UUID campaignId);
}
