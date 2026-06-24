package com.promoguard.demo.scheduler;

import com.promoguard.demo.dto.response.OutboxMessage;
import com.promoguard.demo.repository.OutboxRepository;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutboxPublisherScheduler {

  private static final Logger log = LoggerFactory.getLogger(OutboxPublisherScheduler.class);
  private static final String TOPIC = "voucher-claims";

  private final OutboxRepository outboxRepository;
  private final KafkaTemplate<String, String> kafkaTemplate;

  public OutboxPublisherScheduler(OutboxRepository outboxRepository, KafkaTemplate<String, String> kafkaTemplate) {
    this.outboxRepository = outboxRepository;
    this.kafkaTemplate = kafkaTemplate;
  }

  @Scheduled(fixedDelay = 1000) // Chạy mỗi 1 giây sau khi task trước hoàn thành
  public void publishPendingMessages() {
    List<OutboxMessage> pendingMessages = outboxRepository.findPending(50); // Fetch tối đa 50 messages mỗi đợt

    if (pendingMessages.isEmpty()) {
      return;
    }

    log.debug("Found {} pending outbox messages to publish", pendingMessages.size());

    for (OutboxMessage message : pendingMessages) {
      try {
        // Gửi tin nhắn đồng bộ để đảm bảo tin nhắn được ghi nhận thành công bởi Kafka broker
        kafkaTemplate.send(TOPIC, message.aggregateId(), message.payload())
            .get(5, TimeUnit.SECONDS);


        // Cập nhật trạng thái thành PROCESSED
        outboxRepository.updateStatus(message.id(), "PROCESSED");
        log.info("Successfully published outbox message {} to Kafka", message.id());
      } catch (Exception e) {
        log.error("Failed to publish outbox message {} to Kafka, will retry. Error: {}", message.id(), e.getMessage());
        // Lỗi sẽ giữ nguyên trạng thái PENDING để đợt tiếp theo thử lại
      }
    }
  }
}
