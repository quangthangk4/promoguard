package com.promoguard.demo.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AdminClaimResponse(
    UUID id,
    UUID userId,
    Instant claimedAt
) {}
