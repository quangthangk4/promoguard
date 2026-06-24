package com.promoguard.demo.dto.response;

import com.promoguard.demo.domain.CampaignStatus;
import java.time.Instant;
import java.util.UUID;

public record CampaignResponse(
    UUID id,
    String name,
    int totalQuantity,
    int remainingQuantity,
    CampaignStatus status,
    Instant startTime,
    Instant endTime,
    Instant createdAt
) {}