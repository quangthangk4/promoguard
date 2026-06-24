package com.promoguard.demo.dto.response;

import com.promoguard.demo.domain.CampaignStatus;
import java.util.UUID;

public record CampaignStatsResponse(
    UUID campaignId,
    String name,
    int totalQuantity,
    int remainingQuantity,
    int claimedCount,
    CampaignStatus status
) {}