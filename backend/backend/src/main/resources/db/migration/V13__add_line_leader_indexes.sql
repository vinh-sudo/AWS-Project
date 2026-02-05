-- V13: Add indexes for line_leader_assignment table only
-- Other tables will be handled in future migrations after schema verification

-- (0) Ensure status column exists (may be missing if V8 was applied before status was added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'line_leader_assignment' AND column_name = 'status'
    ) THEN
        ALTER TABLE line_leader_assignment ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
    END IF;
END $$;

-- (1) UNIQUE + partial index:
-- Enforce rule: mỗi leader chỉ được có tối đa 1 assignment đang ACTIVE
CREATE UNIQUE INDEX IF NOT EXISTS uq_leader_one_active_line
ON line_leader_assignment(leader_id)
WHERE status = 'ACTIVE';

-- (2) Index for active assignments lookup
CREATE INDEX IF NOT EXISTS idx_assignment_leader_active
ON line_leader_assignment(leader_id)
WHERE status = 'ACTIVE';
