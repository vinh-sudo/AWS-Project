ALTER TABLE report
    ADD COLUMN IF NOT EXISTS order_id INT;

ALTER TABLE report
    ADD CONSTRAINT fk_report_order
        FOREIGN KEY (order_id)
            REFERENCES orders(order_id)
            ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_report_order_date
    ON report(order_id, work_date);

