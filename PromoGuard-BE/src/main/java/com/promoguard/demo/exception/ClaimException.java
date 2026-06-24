package com.promoguard.demo.exception;

import com.promoguard.demo.domain.ClaimResult;

public class ClaimException extends RuntimeException {
  private final ClaimResult result;

  public ClaimException(ClaimResult result) {
    super(result.name());
    this.result = result;
  }

  public ClaimResult getResult() {
    return result;
  }
}
