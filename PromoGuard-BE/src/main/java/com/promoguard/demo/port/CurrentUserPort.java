package com.promoguard.demo.port;

import java.util.UUID;

public interface CurrentUserPort {
  UUID getUserId();
  String getUsername();
  boolean hasRole(String role);
}
