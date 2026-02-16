-- V14__optimize_line_leader_queries.sql

-- (1) Index cho line_leader_assignment - SAFE
CREATE INDEX IF NOT EXISTS idx_assignment_line_active
ON line_leader_assignment(line_id)
WHERE status = 'ACTIVE';

-- (2) Index cho report - check column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'report' AND column_name = 'line_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_report_line_date
        ON report(line_id, work_date DESC);
    END IF;
END $$;

-- (3) Index cho incident_log - check column exists  
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_log' AND column_name = 'line_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_incident_line_time
        ON incident_log(line_id, timestamp DESC);
    END IF;
END $$;

-- (4) Index cho production_schedule - check column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'production_schedule' AND column_name = 'line_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_schedule_line_status
        ON production_schedule(line_id, status);
    END IF;
END $$;