CREATE TABLE production_file (
                                 id BIGSERIAL PRIMARY KEY,
    -- ID tự tăng, khóa chính

                                 s3_key VARCHAR(500) NOT NULL,
    -- Đường dẫn object trên S3 (VD: orders/2025/02/PO123.pdf)

                                 file_name VARCHAR(255) NOT NULL,
    -- Tên file gốc (PO123.pdf, WI-LineA.xlsx…)

                                 order_id INTEGER,
    -- File gắn với Order (hợp đồng, BOM)
    -- NULL nếu file không thuộc order

                                 plan_id INTEGER,
    -- File gắn với ProductionPlan (routing, capacity plan)

                                 schedule_id INTEGER,
    -- File gắn với ProductionSchedule (work instruction, bản vẽ hôm nay)

                                 uploaded_by INTEGER NOT NULL,
    -- Employee.user_id người upload

                                 uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    -- Thời điểm upload
);
ALTER TABLE production_file
    ADD CONSTRAINT fk_file_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE production_file
    ADD CONSTRAINT fk_file_plan
        FOREIGN KEY (plan_id) REFERENCES production_plan(plan_id) ON DELETE CASCADE;

ALTER TABLE production_file
    ADD CONSTRAINT fk_file_schedule
        FOREIGN KEY (schedule_id) REFERENCES production_schedule(schedule_id) ON DELETE CASCADE;

CREATE INDEX idx_file_order ON production_file(order_id);
CREATE INDEX idx_file_plan ON production_file(plan_id);
CREATE INDEX idx_file_schedule ON production_file(schedule_id);

ALTER TABLE production_plan
    ADD COLUMN plan_name VARCHAR(100);

CREATE INDEX idx_production_plan_name
    ON production_plan(plan_name);
