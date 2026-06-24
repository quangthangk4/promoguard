package com.promoguard.demo.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserClaimResponse(
    UUID claimId,
    UUID campaignId,
    String campaignName,
    Instant claimedAt
) {}
