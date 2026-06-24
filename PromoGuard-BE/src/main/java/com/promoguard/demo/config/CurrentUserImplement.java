package com.promoguard.demo.config;

import com.promoguard.demo.port.CurrentUserPort;
import java.util.Objects;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserImplement implements CurrentUserPort{

  @Override
  public UUID getUserId() {
    return UUID.fromString(Objects.requireNonNull(getJwt().getSubject()));
  }

  @Override
  public String getUsername() {
    return Objects.requireNonNull(getJwt().getClaimAsString("preferred_username"));
  }

  @Override
  public boolean hasRole(String role) {
    return Objects.requireNonNull(getAuthentication().getAuthorities()).stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
  }

  private Jwt getJwt() {
    return (Jwt) getAuthentication().getPrincipal();
  }

  private Authentication getAuthentication() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new IllegalStateException("Không có user đã xác thực trong context");
    }
    return auth;
  }
}
