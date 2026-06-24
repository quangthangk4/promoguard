package com.promoguard.demo.dto.response;

import java.time.Instant;
import java.util.UUID;

public record OutboxMessage(
    UUID id,
    String aggregateType,
    String aggregateId,
    String eventType,
    String payload,
    String status,
    Instant createdAt
) {}
