package com.promoguard.demo.repository;

import com.promoguard.demo.dto.response.OutboxMessage;
import java.util.List;
import java.util.UUID;

public interface OutboxRepository {
  void save(UUID id, String aggregateType, String aggregateId, String eventType, String payload);
  void save(UUID id, String aggregateType, String aggregateId, String eventType, String payload, String status);
  List<OutboxMessage> findPending(int limit);
  List<OutboxMessage> findLatest(int limit);
  void updateStatus(UUID id, String status);
}
