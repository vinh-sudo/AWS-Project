-- Add refresh token columns to accounts table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'refresh_token_hash') THEN
        ALTER TABLE accounts ADD COLUMN refresh_token_hash VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'refresh_token_expired_at') THEN
        ALTER TABLE accounts ADD COLUMN refresh_token_expired_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'refresh_token_revoked') THEN
        ALTER TABLE accounts ADD COLUMN refresh_token_revoked BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'refresh_token_created_at') THEN
        ALTER TABLE accounts ADD COLUMN refresh_token_created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
