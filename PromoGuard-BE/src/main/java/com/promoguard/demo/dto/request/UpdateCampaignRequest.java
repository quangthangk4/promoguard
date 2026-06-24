package com.promoguard.demo.dto.request;

import com.promoguard.demo.domain.CampaignStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record UpdateCampaignRequest(
    @NotBlank String name,
    @Min(1) int totalQuantity,
    @NotNull Instant startTime,
    @NotNull Instant endTime,
    @NotNull CampaignStatus status
) {}
