package com.promoguard.demo.repository.impl;

import static com.promoguard.demo.jooq.Tables.CAMPAIGNS;
import static com.promoguard.demo.jooq.Tables.VOUCHER_CLAIMS;

import com.promoguard.demo.domain.CampaignStatus;
import com.promoguard.demo.dto.request.CreateCampaignRequest;
import com.promoguard.demo.dto.request.UpdateCampaignRequest;
import com.promoguard.demo.dto.response.AdminClaimResponse;
import com.promoguard.demo.dto.response.CampaignResponse;
import com.promoguard.demo.dto.response.CampaignStatsResponse;
import com.promoguard.demo.dto.response.UserClaimResponse;
import com.promoguard.demo.repository.CampaignsRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.Records;
import org.springframework.stereotype.Repository;

@Repository
public class CampaignsRepositoryImpl implements CampaignsRepository {

  private final DSLContext dsl;

  public CampaignsRepositoryImpl(DSLContext dsl) {
    this.dsl = dsl;
  }

  @Override
  public CampaignResponse create(CreateCampaignRequest request) {
    UUID campaignId = UUID.randomUUID();
    return dsl.insertInto(CAMPAIGNS)
        .set(CAMPAIGNS.ID, campaignId)
        .set(CAMPAIGNS.NAME, request.name())
        .set(CAMPAIGNS.TOTAL_QUANTITY, request.totalQuantity())
        .set(CAMPAIGNS.REMAINING_QUANTITY, request.totalQuantity())
        .set(CAMPAIGNS.START_TIME, OffsetDateTime.ofInstant(request.startTime(), ZoneOffset.UTC))
        .set(CAMPAIGNS.END_TIME, OffsetDateTime.ofInstant(request.endTime(), ZoneOffset.UTC))
        .set(CAMPAIGNS.STATUS, request.status().name())
        .returningResult(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf),
            CAMPAIGNS.START_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.END_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .fetchOne(Records.mapping(CampaignResponse::new));
  }

  @Override
  public Optional<CampaignResponse> findById(UUID id) {
    return dsl.select(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf),
            CAMPAIGNS.START_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.END_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(CAMPAIGNS)
        .where(CAMPAIGNS.ID.eq(id))
        .fetchOptional(Records.mapping(CampaignResponse::new));
  }

  @Override
  public Optional<CampaignStatsResponse> findStatsById(UUID id) {
    return dsl.select(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            org.jooq.impl.DSL.field(
                dsl.selectCount()
                    .from(VOUCHER_CLAIMS)
                    .where(VOUCHER_CLAIMS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
            ),
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf)
        )
        .from(CAMPAIGNS)
        .where(CAMPAIGNS.ID.eq(id))
        .fetchOptional(Records.mapping(CampaignStatsResponse::new));
  }

  @Override
  public boolean decrementStock(UUID id) {
    int updated = dsl.update(CAMPAIGNS)
        .set(CAMPAIGNS.REMAINING_QUANTITY, CAMPAIGNS.REMAINING_QUANTITY.minus(1))
        .where(CAMPAIGNS.ID.eq(id))
        .and(CAMPAIGNS.REMAINING_QUANTITY.gt(0))
        .execute();
    return updated > 0;
  }

  @Override
  public void incrementStock(UUID id) {
    dsl.update(CAMPAIGNS)
        .set(CAMPAIGNS.REMAINING_QUANTITY, CAMPAIGNS.REMAINING_QUANTITY.plus(1))
        .where(CAMPAIGNS.ID.eq(id))
        .execute();
  }

  @Override
  public void createClaim(UUID campaignId, UUID userId) {
    dsl.insertInto(VOUCHER_CLAIMS)
        .set(VOUCHER_CLAIMS.ID, UUID.randomUUID())
        .set(VOUCHER_CLAIMS.CAMPAIGN_ID, campaignId)
        .set(VOUCHER_CLAIMS.USER_ID, userId)
        .set(VOUCHER_CLAIMS.CLAIMED_AT, OffsetDateTime.now())
        .execute();
  }

  @Override
  public List<UserClaimResponse> findClaimsByUserId(UUID userId) {
    return dsl.select(
            VOUCHER_CLAIMS.ID,
            VOUCHER_CLAIMS.CAMPAIGN_ID,
            CAMPAIGNS.NAME,
            VOUCHER_CLAIMS.CLAIMED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(VOUCHER_CLAIMS)
        .join(CAMPAIGNS).on(VOUCHER_CLAIMS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
        .where(VOUCHER_CLAIMS.USER_ID.eq(userId))
        .orderBy(VOUCHER_CLAIMS.CLAIMED_AT.desc())
        .fetch(Records.mapping(UserClaimResponse::new));
  }

  @Override
  public List<CampaignResponse> findAll(CampaignStatus status, int limit, int offset) {
    var select = dsl.select(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf),
            CAMPAIGNS.START_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.END_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(CAMPAIGNS);

    var query = status != null ? select.where(CAMPAIGNS.STATUS.eq(status.name())) : select;

    return query.orderBy(CAMPAIGNS.CREATED_AT.desc())
        .limit(limit)
        .offset(offset)
        .fetch(Records.mapping(CampaignResponse::new));
  }

  @Override
  public Optional<CampaignResponse> updateStatus(UUID campaignId, CampaignStatus status) {
    return dsl.update(CAMPAIGNS)
        .set(CAMPAIGNS.STATUS, status.name())
        .where(CAMPAIGNS.ID.eq(campaignId))
        .returningResult(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf),
            CAMPAIGNS.START_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.END_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .fetchOptional(Records.mapping(CampaignResponse::new));
  }

  @Override
  public List<AdminClaimResponse> findClaimsByCampaignId(UUID campaignId, int limit, int offset) {
    return dsl.select(
            VOUCHER_CLAIMS.ID,
            VOUCHER_CLAIMS.USER_ID,
            VOUCHER_CLAIMS.CLAIMED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .from(VOUCHER_CLAIMS)
        .where(VOUCHER_CLAIMS.CAMPAIGN_ID.eq(campaignId))
        .orderBy(VOUCHER_CLAIMS.CLAIMED_AT.desc())
        .limit(limit)
        .offset(offset)
        .fetch(Records.mapping(AdminClaimResponse::new));
  }

  @Override
  public Optional<CampaignResponse> updateCampaign(UUID campaignId, UpdateCampaignRequest request) {
    return dsl.update(CAMPAIGNS)
        .set(CAMPAIGNS.NAME, request.name())
        .set(CAMPAIGNS.REMAINING_QUANTITY, CAMPAIGNS.REMAINING_QUANTITY.plus(request.totalQuantity()).minus(CAMPAIGNS.TOTAL_QUANTITY))
        .set(CAMPAIGNS.TOTAL_QUANTITY, request.totalQuantity())
        .set(CAMPAIGNS.START_TIME, OffsetDateTime.ofInstant(request.startTime(), ZoneOffset.UTC))
        .set(CAMPAIGNS.END_TIME, OffsetDateTime.ofInstant(request.endTime(), ZoneOffset.UTC))
        .set(CAMPAIGNS.STATUS, request.status().name())
        .where(CAMPAIGNS.ID.eq(campaignId))
        .returningResult(
            CAMPAIGNS.ID,
            CAMPAIGNS.NAME,
            CAMPAIGNS.TOTAL_QUANTITY,
            CAMPAIGNS.REMAINING_QUANTITY,
            CAMPAIGNS.STATUS.convertFrom(CampaignStatus::valueOf),
            CAMPAIGNS.START_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.END_TIME.convertFrom(OffsetDateTime::toInstant),
            CAMPAIGNS.CREATED_AT.convertFrom(OffsetDateTime::toInstant)
        )
        .fetchOptional(Records.mapping(CampaignResponse::new));
  }

  @Override
  public boolean deleteById(UUID campaignId) {
    int deleted = dsl.deleteFrom(CAMPAIGNS)
        .where(CAMPAIGNS.ID.eq(campaignId))
        .execute();
    return deleted > 0;
  }
}
