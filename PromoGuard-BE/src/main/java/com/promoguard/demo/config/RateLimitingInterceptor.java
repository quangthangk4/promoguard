package com.promoguard.demo.config;

import com.promoguard.demo.exception.RateLimitException;
import com.promoguard.demo.port.CurrentUserPort;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

  private final StringRedisTemplate redisTemplate;
  private final CurrentUserPort currentUserPort;
  private final RedisScript<List> rateLimitScript;

  private static final String LUA_SCRIPT =
      "local key = KEYS[1]\n" +
      "local now = tonumber(ARGV[1])\n" +
      "local window = tonumber(ARGV[2])\n" +
      "local limit = tonumber(ARGV[3])\n" +
      "local member = ARGV[4]\n" +
      "\n" +
      "redis.call('ZREMRANGEBYSCORE', key, 0, now - window)\n" +
      "local current_requests = redis.call('ZCARD', key)\n" +
      "\n" +
      "local allowed = 0\n" +
      "local remaining = limit - current_requests\n" +
      "\n" +
      "if current_requests < limit then\n" +
      "    allowed = 1\n" +
      "    redis.call('ZADD', key, now, member)\n" +
      "    redis.call('EXPIRE', key, math.ceil(window / 1000))\n" +
      "    remaining = remaining - 1\n" +
      "end\n" +
      "\n" +
      "local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')\n" +
      "local reset = 0\n" +
      "if #oldest > 0 then\n" +
      "    local oldest_score = tonumber(oldest[2])\n" +
      "    reset = math.ceil((oldest_score + window - now) / 1000)\n" +
      "    if reset < 0 then reset = 0 end\n" +
      "else\n" +
      "    reset = math.ceil(window / 1000)\n" +
      "end\n" +
      "\n" +
      "return {allowed, remaining, reset}";

  public RateLimitingInterceptor(StringRedisTemplate redisTemplate, CurrentUserPort currentUserPort) {
    this.redisTemplate = redisTemplate;
    this.currentUserPort = currentUserPort;
    this.rateLimitScript = RedisScript.of(LUA_SCRIPT, List.class);
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    if (!(handler instanceof HandlerMethod handlerMethod)) {
      return true;
    }

    RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
    if (rateLimit == null) {
      return true;
    }

    String userId;
    try {
      userId = currentUserPort.getUserId().toString();
    } catch (Exception e) {
      userId = request.getRemoteAddr();
    }

    String redisKey = "rate_limit:" + userId + ":" + handlerMethod.getMethod().getName();
    long now = System.currentTimeMillis();
    long windowMs = rateLimit.windowSeconds() * 1000L;
    long limit = rateLimit.limit();
    String member = now + ":" + UUID.randomUUID();

    List<?> result = redisTemplate.execute(
        rateLimitScript,
        List.of(redisKey),
        String.valueOf(now),
        String.valueOf(windowMs),
        String.valueOf(limit),
        member
    );

    if (result == null || result.size() < 3) {
      return true;
    }

    long allowed = ((Number) result.get(0)).longValue();
    long remaining = ((Number) result.get(1)).longValue();
    long reset = ((Number) result.get(2)).longValue();

    // Thiết lập các header HTTP standard cho Rate Limiting
    response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
    response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
    response.setHeader("X-RateLimit-Reset", String.valueOf(reset));

    if (allowed == 0) {
      response.setHeader("Retry-After", String.valueOf(reset));
      throw new RateLimitException("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.", (int) reset);
    }

    return true;
  }
}
