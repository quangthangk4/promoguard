CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_quantity INT NOT NULL,
    remaining_quantity INT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voucher_claims (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_campaign_user UNIQUE (campaign_id, user_id),
    CONSTRAINT fk_voucher_claims_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);