package com.promoguard.demo.simulation;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

public class UserJourneySimulation extends Simulation {

  private final String targetUrl = System.getProperty("target.url", "http://56.10.12.163:8080");
  private final String campaignId = System.getProperty("campaign.id", "441ca776-2953-4e6e-b5f5-53544c3fdaa1");

  // Đọc cấu hình động truyền vào từ lệnh Maven
  private final int targetUsersPerSec = Integer.getInteger("users.per.sec", 10);
  private final int rampDurationSeconds = Integer.getInteger("ramp.duration", 30);
  private final int holdDurationMinutes = Integer.getInteger("hold.duration", 2);

  private final HttpProtocolBuilder httpProtocol = http
      .baseUrl(targetUrl)
      .acceptHeader("application/json")
      .contentTypeHeader("application/json");

  private final FeederBuilder.FileBased<String> csvFeeder = csv("tokens.csv").circular();

  private final ScenarioBuilder scn = scenario("Standard User Journey Load Test")
      .feed(csvFeeder)
      .exec(http("1. Get Campaigns List")
          .get("/api/v1/campaigns")
          .header("Authorization", "Bearer #{token}")
          .check(status().is(200))
      )
      .pause(1)
      
      .exec(http("2. Get Campaign Detail")
          .get("/api/v1/campaigns/" + campaignId)
          .header("Authorization", "Bearer #{token}")
          .check(status().is(200))
      )
      .pause(2)
      
      .exec(http("3. Claim Voucher")
          .post("/api/v1/campaigns/" + campaignId + "/claim")
          .header("Authorization", "Bearer #{token}")
          .check(status().in(200, 400))
      )
      .pause(1)
      
      .exec(http("4. Get My Claims")
          .get("/api/v1/campaigns/my-claims")
          .header("Authorization", "Bearer #{token}")
          .check(status().is(200))
      );

  {
    setUp(
        scn.injectOpen(
            nothingFor(Duration.ofSeconds(5)),
            rampUsersPerSec(1).to(targetUsersPerSec).during(Duration.ofSeconds(rampDurationSeconds)),
            constantUsersPerSec(targetUsersPerSec).during(Duration.ofMinutes(holdDurationMinutes))
        )
    ).protocols(httpProtocol);
  }
}
