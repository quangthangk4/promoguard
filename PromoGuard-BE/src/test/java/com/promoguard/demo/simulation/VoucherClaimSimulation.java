package com.promoguard.demo.simulation;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

public class VoucherClaimSimulation extends Simulation {

  private final String targetUrl = System.getProperty("target.url", "http://56.10.12.163:8080");
  private final String campaignId = System.getProperty("campaign.id", "80cef24b-80dd-4183-84ef-3b4de7c0c530");

  // Đọc cấu hình động truyền vào từ lệnh Maven
  // Mặc định: 100 users, tăng tải trong 10 giây
  private final int totalUsers = Integer.getInteger("users", 100);
  private final int rampDuration = Integer.getInteger("ramp", 10);

  private final HttpProtocolBuilder httpProtocol = http
      .baseUrl(targetUrl)
      .acceptHeader("application/json")
      .contentTypeHeader("application/json");

  private final FeederBuilder.FileBased<String> csvFeeder = csv("tokens.csv").circular();

  private final ScenarioBuilder scn = scenario("Voucher Claim Load Test Scenario")
      .feed(csvFeeder)
      .exec(http("Post Claim Request")
          .post("/api/v1/campaigns/" + campaignId + "/claim")
          .header("Authorization", "Bearer #{token}")
          .check(status().in(200, 400))
      );

  {
    // Chia tải: 10% click ngay lập tức, 90% còn lại ramp up trong duration
    int immediateUsers = Math.max(1, totalUsers / 10);
    int rampedUsers = Math.max(1, totalUsers - immediateUsers);

    setUp(
        scn.injectOpen(
            nothingFor(Duration.ofSeconds(2)),
            atOnceUsers(immediateUsers),
            rampUsers(rampedUsers).during(Duration.ofSeconds(rampDuration))
        )
    ).protocols(httpProtocol);
  }
}
