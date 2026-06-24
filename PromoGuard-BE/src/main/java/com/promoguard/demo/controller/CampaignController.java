package com.promoguard.demo.controller;

import com.promoguard.demo.config.RateLimit;
import com.promoguard.demo.domain.CampaignStatus;
import com.promoguard.demo.dto.request.CreateCampaignRequest;
import com.promoguard.demo.dto.request.UpdateCampaignRequest;
import com.promoguard.demo.dto.response.AdminClaimResponse;
import com.promoguard.demo.dto.response.ApiResponse;
import com.promoguard.demo.dto.response.CampaignResponse;
import com.promoguard.demo.dto.response.CampaignStatsResponse;
import com.promoguard.demo.dto.response.ClaimResponse;
import com.promoguard.demo.dto.response.UserClaimResponse;
import com.promoguard.demo.service.CampaignsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/campaigns")
public class CampaignController {

  private final CampaignsService campaignsService;

  public CampaignController(CampaignsService campaignsService) {
    this.campaignsService = campaignsService;
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CampaignResponse> createCampaign(@Valid @RequestBody CreateCampaignRequest request) {
    return ApiResponse.success("Tạo chiến dịch thành công", campaignsService.createCampaign(request));
  }

  @PostMapping("/{campaignId}/claim")
  @RateLimit(limit = 5, windowSeconds = 10)
  public ApiResponse<ClaimResponse> claimVoucher(@PathVariable UUID campaignId) {
    return ApiResponse.success("Claim thành công", campaignsService.claimVoucher(campaignId));
  }

  @GetMapping("/{campaignId}/stats")
  public ApiResponse<CampaignStatsResponse> getCampaignStats(@PathVariable UUID campaignId) {
    return ApiResponse.success(campaignsService.getCampaignStats(campaignId));
  }

  @GetMapping("/my-claims")
  public ApiResponse<List<UserClaimResponse>> getMyClaims() {
    return ApiResponse.success(campaignsService.getMyClaims());
  }

  @GetMapping
  public ApiResponse<List<CampaignResponse>> getCampaigns(
      @RequestParam(required = false) CampaignStatus status,
      @RequestParam(defaultValue = "10") int limit,
      @RequestParam(defaultValue = "0") int offset
  ) {
    return ApiResponse.success(campaignsService.getCampaigns(status, limit, offset));
  }

  @PatchMapping("/{campaignId}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CampaignResponse> updateCampaignStatus(
      @PathVariable UUID campaignId,
      @RequestParam CampaignStatus status
  ) {
    return ApiResponse.success("Cập nhật trạng thái chiến dịch thành công", campaignsService.updateCampaignStatus(campaignId, status));
  }

  @GetMapping("/{campaignId}")
  public ApiResponse<CampaignResponse> getCampaignById(@PathVariable UUID campaignId) {
    return ApiResponse.success(campaignsService.getCampaignById(campaignId));
  }

  @GetMapping("/{campaignId}/claims")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<AdminClaimResponse>> getCampaignClaims(
      @PathVariable UUID campaignId,
      @RequestParam(defaultValue = "10") int limit,
      @RequestParam(defaultValue = "0") int offset
  ) {
    return ApiResponse.success(campaignsService.getCampaignClaims(campaignId, limit, offset));
  }

  @PutMapping("/{campaignId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CampaignResponse> updateCampaign(
      @PathVariable UUID campaignId,
      @Valid @RequestBody UpdateCampaignRequest request
  ) {
    return ApiResponse.success("Cập nhật thông tin chiến dịch thành công", campaignsService.updateCampaign(campaignId, request));
  }

  @DeleteMapping("/{campaignId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> deleteCampaign(@PathVariable UUID campaignId) {
    campaignsService.deleteCampaign(campaignId);
    return ApiResponse.success("Xóa chiến dịch thành công");
  }

  @GetMapping("/events")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<com.promoguard.demo.dto.response.OutboxMessage>> getLatestEvents(
      @RequestParam(defaultValue = "20") int limit
  ) {
    return ApiResponse.success(campaignsService.getLatestEvents(limit));
  }
}
