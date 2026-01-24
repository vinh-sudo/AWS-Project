ALTER TABLE accounts
ADD COLUMN refresh_token_hash VARCHAR(255),
ADD COLUMN refresh_token_expired_at TIMESTAMPTZ,
ADD COLUMN refresh_token_revoked BOOLEAN DEFAULT FALSE,
ADD COLUMN refresh_token_created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
