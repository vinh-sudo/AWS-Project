ALTER TABLE report
DROP COLUMN schedule_id,
    DROP COLUMN produced_quantity;
ALTER TABLE report
    ADD COLUMN target_quantity   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN good_quantity     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN reject_quantity   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE report
    ADD CONSTRAINT ck_report_qty_valid
        CHECK (good_quantity + reject_quantity <= target_quantity);
DROP INDEX IF EXISTS idx_report_employee_id;
DROP INDEX IF EXISTS idx_report_line_id;
DROP INDEX IF EXISTS idx_report_schedule_id;
DROP INDEX IF EXISTS idx_report_work_date;
DROP INDEX IF EXISTS idx_report_line_date;
CREATE INDEX idx_report_line_day_shift
    ON report(line_id, work_date, shift);
CREATE INDEX idx_report_date_line
    ON report(work_date, line_id);
CREATE INDEX idx_report_kpi
    ON report(work_date)
    INCLUDE (line_id, good_quantity, reject_quantity, target_quantity, downtime_minutes);
