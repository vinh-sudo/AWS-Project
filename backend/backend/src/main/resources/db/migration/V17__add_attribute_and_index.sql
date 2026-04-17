ALTER TABLE machine
    ADD COLUMN runtime_status VARCHAR(20);

CREATE INDEX idx_machine_runtime_status
    ON machine (runtime_status);

CREATE INDEX idx_machine_line_runtime
    ON machine (line_id, runtime_status);



-- 3. Lấy notification theo object (order / schedule / machine)
CREATE INDEX idx_notification_source
    ON notification (source_type, source_id);

-- 4. Timeline nhanh (latest first)
CREATE INDEX idx_notification_created_at
    ON notification (created_at DESC);
