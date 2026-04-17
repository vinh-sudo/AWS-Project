-- V19__add_audit_log_enhancements.sql

-- Step 1: Add new columns
ALTER TABLE audit_log 
ADD COLUMN entity_id INT,
ADD COLUMN ip_address VARCHAR(45);

-- Step 2: Optionally tighten action_type column size
-- ALTER TABLE audit_log ALTER COLUMN action_type TYPE VARCHAR(30);

-- Step 3: Modify details size limit (CRITICAL - Prevent bloat)
ALTER TABLE audit_log 
ALTER COLUMN details TYPE VARCHAR(2048) USING LEFT(details, 2048);

-- Step 4: Make timestamp NOT NULL with default
UPDATE audit_log
SET "timestamp" = CURRENT_TIMESTAMP
WHERE "timestamp" IS NULL;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM audit_log WHERE "timestamp" IS NULL) THEN
		RAISE EXCEPTION 'audit_log.timestamp still contains NULL values';
	END IF;
END $$;

ALTER TABLE audit_log 
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "timestamp" SET NOT NULL;

-- Step 5: Add indexes for query optimization
-- Index 1: Query logs by user + time range
CREATE INDEX idx_audit_user_time 
ON audit_log(user_id, "timestamp" DESC);

-- Index 2: Query logs by entity (e.g., "all logs of Order #123")
CREATE INDEX idx_audit_entity 
ON audit_log(entity, entity_id, "timestamp" DESC);

-- Index 3: Query logs by action type
CREATE INDEX idx_audit_action 
ON audit_log(action_type, "timestamp" DESC);

-- Index 4: For archival job (move logs older than 3 months)
CREATE INDEX idx_audit_timestamp 
ON audit_log("timestamp" DESC);

-- Note: Để production → Run trong maintenance window hoặc giờ thấp điểm