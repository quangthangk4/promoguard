package com.promoguard.demo.repository.impl;

import static com.promoguard.demo.jooq.Tables.OUTBOX_MESSAGES;

import com.promoguard.demo.dto.response.OutboxMessage;
import com.promoguard.demo.repository.OutboxRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.Records;
import org.springframework.stereotype.Repository;

@Repository
public class OutboxRepositoryImpl implements OutboxRepository {

  private final DSLContext dsl;

  public OutboxRepositoryImpl(DSLContext dsl) {
    this.dsl = dsl;
  }

  @Override
  public void save(UUID id, String aggregateType, String aggregateId, String eventType, String payload) {
    save(id, aggregateType, aggregateId, eventType, payload, "PENDING");
  }

  @Override
  public void save(UUID id, String aggregateType, String aggregateId, String eventType, String payload, String status) {
    dsl.insertInto(OUTBOX_MESSAGES)
        .set(OUTBOX_MESSAGES.ID, id)
        .set(OUTBOX_MESSAGES.AGGREGATE_TYPE, aggregateType)
        .set(OUTBOX_MESSAGES.AGGREGATE_ID, aggregateId)
        .set(OUTBOX_MESSAGES.EVENT_TYPE, eventType)
        .set(OUTBOX_MESSAGES.PAYLOAD, payload)
        .set(OUTBOX_MESSAGES.STATUS, status)
        .set(OUTBOX_MESSAGES.CREATED_AT, OffsetDateTime.now())
        .execute();
  }

  @Override
  public List<OutboxMessage> findPending(int limit) {
    return dsl.select(
            OUTBOX_MESSAGES.ID,
            OUTBOX_MESSAGES.AGGREGATE_TYPE,
            OUTBOX_MESSAGES.AGGREGATE_ID,
            OUTBOX_MESSAGES.EVENT_TYPE,
            OUTBOX_MESSAGES.PAYLOAD,
            OUTBOX_MESSAGES.STATUS,
            OUTBOX_MESSAGES.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(OUTBOX_MESSAGES)
        .where(OUTBOX_MESSAGES.STATUS.eq("PENDING"))
        .orderBy(OUTBOX_MESSAGES.CREATED_AT.asc())
        .limit(limit)
        .fetch(Records.mapping(OutboxMessage::new));
  }

  @Override
  public List<OutboxMessage> findLatest(int limit) {
    return dsl.select(
            OUTBOX_MESSAGES.ID,
            OUTBOX_MESSAGES.AGGREGATE_TYPE,
            OUTBOX_MESSAGES.AGGREGATE_ID,
            OUTBOX_MESSAGES.EVENT_TYPE,
            OUTBOX_MESSAGES.PAYLOAD,
            OUTBOX_MESSAGES.STATUS,
            OUTBOX_MESSAGES.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(OUTBOX_MESSAGES)
        .orderBy(OUTBOX_MESSAGES.CREATED_AT.desc())
        .limit(limit)
        .fetch(Records.mapping(OutboxMessage::new));
  }

  @Override
  public void updateStatus(UUID id, String status) {
    dsl.update(OUTBOX_MESSAGES)
        .set(OUTBOX_MESSAGES.STATUS, status)
        .where(OUTBOX_MESSAGES.ID.eq(id))
        .execute();
  }
}
