package com.promoguard.demo.config;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class JwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  @Value("${app.keycloak.client-id}")
  private String resourceId;

  // Không cần principle-attribute nữa, hardcode hoặc thêm field riêng nếu cần
  private static final String PRINCIPLE_CLAIM = "preferred_username";

  @Override
  public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
    Collection<GrantedAuthority> authorities = Stream.concat(
        extractRealmRoles(jwt).stream(),
        extractResourceRoles(jwt).stream()
    ).collect(Collectors.toSet());

    return new JwtAuthenticationToken(jwt, authorities, getPrincipleClaimName(jwt));
  }

  private String getPrincipleClaimName(Jwt jwt) {
    String claim = jwt.getClaim(PRINCIPLE_CLAIM);
    return claim != null ? claim : jwt.getClaim(JwtClaimNames.SUB);
  }

  @SuppressWarnings("unchecked")
  private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
    Map<String, Object> realmAccess = jwt.getClaim("realm_access");
    if (realmAccess == null || realmAccess.get("roles") == null) {
      return Set.of();
    }
    Collection<String> roles = (Collection<String>) realmAccess.get("roles");
    return roles.stream()
        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
        .collect(Collectors.toSet());
  }

  @SuppressWarnings("unchecked")
  private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
    Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
    if (resourceAccess == null || resourceAccess.get(resourceId) == null) {
      return Set.of();
    }
    Map<String, Object> resource = (Map<String, Object>) resourceAccess.get(resourceId);
    Collection<String> roles = (Collection<String>) resource.get("roles");
    if (roles == null) return Set.of();

    return roles.stream()
        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
        .collect(Collectors.toSet());
  }
}