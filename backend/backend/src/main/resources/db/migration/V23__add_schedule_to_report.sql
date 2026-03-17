ALTER TABLE report
    ADD COLUMN IF NOT EXISTS schedule_id INT;

ALTER TABLE report
    ADD CONSTRAINT fk_report_schedule
        FOREIGN KEY (schedule_id)
            REFERENCES production_schedule(schedule_id)
            ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_report_schedule_date
    ON report(schedule_id, work_date);

