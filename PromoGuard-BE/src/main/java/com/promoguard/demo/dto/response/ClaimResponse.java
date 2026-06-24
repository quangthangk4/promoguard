package com.promoguard.demo.dto.response;

import com.promoguard.demo.domain.ClaimResult;

public record ClaimResponse(
    ClaimResult result,
    String message
) {
  public static ClaimResponse of(ClaimResult result) {
    return new ClaimResponse(result, switch (result) {
      case SUCCESS -> "Claim thành công";
      case SOLD_OUT -> "Voucher đã hết";
      case ALREADY_CLAIMED -> "Bạn đã claim voucher này rồi";
      case CAMPAIGN_NOT_ACTIVE -> "Campaign chưa active hoặc đã kết thúc";
    });
  }
}