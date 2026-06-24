package com.promoguard.demo;

import static com.promoguard.demo.jooq.Tables.OUTBOX_MESSAGES;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class CampaignControllerIntegrationTest {

  private MockMvc mockMvc;

  @Autowired
  private WebApplicationContext webApplicationContext;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Autowired
  private com.promoguard.demo.repository.OutboxRepository outboxRepository;

  @Autowired
  private DSLContext dslContext;

  @BeforeEach
  void setUp() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
        .apply(SecurityMockMvcConfigurers.springSecurity())
        .build();
  }

  @Test
  void testCampaignLifecycle_CreateClaimAndStats() throws Exception {
    UUID userId = UUID.randomUUID();

    // 1. Create a campaign (Admin Only)
    String createRequestJson = """
        {
          "name": "Flash Sale Voucher Shopee 10-10",
          "totalQuantity": 5,
          "startTime": "%s",
          "endTime": "%s",
          "status": "ACTIVE"
        }
        """.formatted(
            Instant.now().minus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(2, ChronoUnit.HOURS).toString()
        );

    MvcResult createResult = mockMvc.perform(post("/api/v1/campaigns")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(createRequestJson))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.id").exists())
        .andExpect(jsonPath("$.data.name").value("Flash Sale Voucher Shopee 10-10"))
        .andExpect(jsonPath("$.data.totalQuantity").value(5))
        .andExpect(jsonPath("$.data.remainingQuantity").value(5))
        .andExpect(jsonPath("$.data.status").value("ACTIVE"))
        .andReturn();

    String responseBody = createResult.getResponse().getContentAsString();
    UUID campaignId = UUID.fromString(objectMapper.readTree(responseBody).get("data").get("id").asText());

    // 2. List all campaigns
    mockMvc.perform(get("/api/v1/campaigns")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data[0].id").value(campaignId.toString()));

    // 3. Claim voucher - Success (First claim)
    mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.result").value("SUCCESS"))
        .andExpect(jsonPath("$.data.message").value("Claim thành công"));

    // 4. Claim voucher - Duplicate (Same user tries to claim again)
    mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.data.result").value("ALREADY_CLAIMED"))
        .andExpect(jsonPath("$.data.message").value("Bạn đã claim voucher này rồi"));

    // 4b. Claim voucher - Success (Second claim by another user)
    UUID userId2 = UUID.randomUUID();
    mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
            .with(jwt().jwt(builder -> builder.subject(userId2.toString()).claim("preferred_username", "testuser2"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.result").value("SUCCESS"));

    // 5. Get stats
    mockMvc.perform(get("/api/v1/campaigns/" + campaignId + "/stats")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.campaignId").value(campaignId.toString()))
        .andExpect(jsonPath("$.data.totalQuantity").value(5))
        .andExpect(jsonPath("$.data.remainingQuantity").value(3))
        .andExpect(jsonPath("$.data.claimedCount").value(2));

    // 6. Get my claimed vouchers
    mockMvc.perform(get("/api/v1/campaigns/my-claims")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data[0].campaignId").value(campaignId.toString()))
        .andExpect(jsonPath("$.data[0].campaignName").value("Flash Sale Voucher Shopee 10-10"));

    // 7. Update status to ENDED (Admin Only)
    mockMvc.perform(patch("/api/v1/campaigns/" + campaignId + "/status")
            .param("status", "ENDED")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.status").value("ENDED"));

    // 8. Get campaign by ID
    mockMvc.perform(get("/api/v1/campaigns/" + campaignId)
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.id").value(campaignId.toString()))
        .andExpect(jsonPath("$.data.name").value("Flash Sale Voucher Shopee 10-10"))
        .andExpect(jsonPath("$.data.status").value("ENDED"));

    // 9. Get campaign claims (Admin Only)
    mockMvc.perform(get("/api/v1/campaigns/" + campaignId + "/claims")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data[0].userId").value(userId2.toString()))
        .andExpect(jsonPath("$.data[1].userId").value(userId.toString()))
        .andExpect(jsonPath("$.data[0].id").exists());

    // 10. Update Campaign (Admin Only)
    String updateRequestJson = """
        {
          "name": "Flash Sale Voucher Shopee 10-10 Updated",
          "totalQuantity": 10,
          "startTime": "%s",
          "endTime": "%s",
          "status": "ACTIVE"
        }
        """.formatted(
            Instant.now().minus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(4, ChronoUnit.HOURS).toString()
        );

    mockMvc.perform(put("/api/v1/campaigns/" + campaignId)
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(updateRequestJson))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.name").value("Flash Sale Voucher Shopee 10-10 Updated"))
        .andExpect(jsonPath("$.data.totalQuantity").value(10))
        .andExpect(jsonPath("$.data.remainingQuantity").value(8)); // was 3 remaining (5 total - 2 claimed). 2 claimed remains, so 10 - 2 = 8.

    // 10b. Update Campaign - Bad Request (totalQuantity < claimed)
    String updateRequestJsonInvalid = """
        {
          "name": "Flash Sale Voucher Shopee 10-10 Updated Again",
          "totalQuantity": 1,
          "startTime": "%s",
          "endTime": "%s",
          "status": "ACTIVE"
        }
        """.formatted(
            Instant.now().minus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(4, ChronoUnit.HOURS).toString()
        );

    mockMvc.perform(put("/api/v1/campaigns/" + campaignId)
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(updateRequestJsonInvalid))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").value("Tổng số lượng không thể nhỏ hơn số lượng voucher đã được claim (2)"));

    // 11. Delete Campaign (Admin Only) - Create a DRAFT campaign to delete
    String createDraftRequestJson = """
        {
          "name": "Draft Campaign To Delete",
          "totalQuantity": 5,
          "startTime": "%s",
          "endTime": "%s",
          "status": "DRAFT"
        }
        """.formatted(
            Instant.now().plus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(2, ChronoUnit.HOURS).toString()
        );

    MvcResult draftCreateResult = mockMvc.perform(post("/api/v1/campaigns")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(createDraftRequestJson))
        .andExpect(status().isOk())
        .andReturn();

    UUID draftCampaignId = UUID.fromString(objectMapper.readTree(draftCreateResult.getResponse().getContentAsString()).get("data").get("id").asText());

    // Delete it
    mockMvc.perform(delete("/api/v1/campaigns/" + draftCampaignId)
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("Xóa chiến dịch thành công"));

    // Verify it doesn't exist anymore
    mockMvc.perform(get("/api/v1/campaigns/" + draftCampaignId)
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").value("Chiến dịch không tồn tại"));
  }

  @Test
  void testRateLimiting_ClaimVoucher() throws Exception {
    UUID userId = UUID.randomUUID();

    // 1. Create a campaign with quantity 10 (Admin Only)
    String createRequestJson = """
        {
          "name": "Rate Limit Campaign",
          "totalQuantity": 10,
          "startTime": "%s",
          "endTime": "%s",
          "status": "ACTIVE"
        }
        """.formatted(
            Instant.now().minus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(2, ChronoUnit.HOURS).toString()
        );

    MvcResult createResult = mockMvc.perform(post("/api/v1/campaigns")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(createRequestJson))
        .andExpect(status().isOk())
        .andReturn();

    UUID campaignId = UUID.fromString(objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").get("id").asText());

    // 2. Perform 5 calls within 10 seconds (Rate limit is 5)
    for (int i = 1; i <= 5; i++) {
      mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
              .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
          .andExpect(i == 1 ? status().isOk() : status().isBadRequest());
    }

    // 3. 6th call should be rate limited (429 Too Many Requests)
    mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").value("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."));
  }

  @Test
  void testOutboxPattern_ClaimVoucher() throws Exception {
    UUID userId = UUID.randomUUID();

    // 1. Create a campaign
    String createRequestJson = """
        {
          "name": "Outbox Campaign",
          "totalQuantity": 5,
          "startTime": "%s",
          "endTime": "%s",
          "status": "ACTIVE"
        }
        """.formatted(
            Instant.now().minus(1, ChronoUnit.HOURS).toString(),
            Instant.now().plus(2, ChronoUnit.HOURS).toString()
        );

    MvcResult createResult = mockMvc.perform(post("/api/v1/campaigns")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .jwt(builder -> builder.subject(UUID.randomUUID().toString())
                    .claim("preferred_username", "admin")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(createRequestJson))
        .andExpect(status().isOk())
        .andReturn();

    UUID campaignId = UUID.fromString(objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data").get("id").asText());

    // 2. Claim voucher
    mockMvc.perform(post("/api/v1/campaigns/" + campaignId + "/claim")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()).claim("preferred_username", "testuser"))))
        .andExpect(status().isOk());

    // 3. Wait up to 5 seconds for the outbox message to be processed and status updated to PROCESSED
    boolean processed = false;
    for (int i = 0; i < 50; i++) {
      String status = dslContext.select(OUTBOX_MESSAGES.STATUS)
          .from(OUTBOX_MESSAGES)
          .where(OUTBOX_MESSAGES.AGGREGATE_ID.eq(campaignId.toString()))
          .fetchOne(OUTBOX_MESSAGES.STATUS);

      if ("PROCESSED".equals(status)) {
        processed = true;
        break;
      }
      Thread.sleep(100);
    }

    org.junit.jupiter.api.Assertions.assertTrue(processed, "Outbox message should be processed and updated to PROCESSED status");
  }
}
