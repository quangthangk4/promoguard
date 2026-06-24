package com.promoguard.demo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.Scopes;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:http://localhost:8082/realms/promoguard}")
  private String issuerUri;

  @Bean
  public OpenAPI customOpenAPI() {
    final String bearerSchemeName = "bearerAuth";
    final String oauth2SchemeName = "keycloakAuth";

    String authUrl = issuerUri + "/protocol/openid-connect/auth";
    String tokenUrl = issuerUri + "/protocol/openid-connect/token";

    return new OpenAPI()
        .info(new Info()
            .title("PromoGuard API")
            .version("1.0")
            .description("Hệ thống Flash Sale Voucher Chịu Tải Cao API Documentation"))
        .addSecurityItem(new SecurityRequirement()
            .addList(bearerSchemeName)
            .addList(oauth2SchemeName))
        .components(new Components()
            .addSecuritySchemes(bearerSchemeName,
                new SecurityScheme()
                    .name(bearerSchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT"))
            .addSecuritySchemes(oauth2SchemeName,
                new SecurityScheme()
                    .name(oauth2SchemeName)
                    .type(SecurityScheme.Type.OAUTH2)
                    .description("Đăng nhập trực tiếp qua Keycloak")
                    .flows(new OAuthFlows()
                        .authorizationCode(new OAuthFlow()
                            .authorizationUrl(authUrl)
                            .tokenUrl(tokenUrl)
                            .scopes(new Scopes().addString("openid", "Quyền OpenID mặc định"))))));
  }
}
