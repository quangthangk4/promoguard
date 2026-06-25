package com.promoguard.demo.simulation;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

public class RateLimitSimulation extends Simulation {

  // 1. Cấu hình giao thức HTTP
  private final String targetUrl = System.getProperty("target.url", "http://56.10.12.163:8080");
  private final String campaignId = System.getProperty("campaign.id", "441ca776-2953-4e6e-b5f5-53544c3fdaa1");

  private final HttpProtocolBuilder httpProtocol = http
      .baseUrl(targetUrl)
      .acceptHeader("application/json")
      .contentTypeHeader("application/json");

  // 2. Đọc danh sách Token
  private final FeederBuilder.FileBased<String> csvFeeder = csv("tokens.csv").circular();

  // 3. Kịch bản gửi liên tiếp 10 yêu cầu không nghỉ (Spam Test)
  // Cấu hình RateLimit của hệ thống: limit = 5, windowSeconds = 10
  // Nên 5 request đầu sẽ là 200/400 (hợp lệ), từ request thứ 6 trở đi phải trả về 429.
  private final ScenarioBuilder scn = scenario("Rate Limit Spam Test")
      .feed(csvFeeder)
      .repeat(10, "requestIndex").on(
          exec(http("Spam Request #{requestIndex}")
              .post("/api/v1/campaigns/" + campaignId + "/claim")
              .header("Authorization", "Bearer #{token}")
              // Chấp nhận HTTP 200/400 cho các requests đầu và 429 cho các requests bị chặn
              .check(status().in(200, 400, 429))
          )
      );

  // 4. Khởi chạy 50 người dùng đồng thời cùng thực hiện hành vi spam để kiểm thử
  {
    setUp(
        scn.injectOpen(
            nothingFor(Duration.ofSeconds(2)),
            atOnceUsers(50) // 50 users spam đồng loạt
        )
    ).protocols(httpProtocol);
  }
}
