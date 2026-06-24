package com.promoguard.demo.dto.event;

import java.time.Instant;
import java.util.UUID;

public record VoucherClaimedEvent(
    UUID campaignId,
    UUID userId,
    Instant claimedAt
) {}
