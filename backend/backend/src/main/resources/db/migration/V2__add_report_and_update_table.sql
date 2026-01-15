

ALTER TABLE employee
DROP COLUMN department;

ALTER TABLE employee
DROP COLUMN skill_level;


ALTER TABLE statistic
    RENAME COLUMN date TO work_date;

ALTER TABLE statistic
    RENAME COLUMN output TO total_output;

ALTER TABLE statistic
    RENAME COLUMN downtime TO total_downtime;

ALTER TABLE statistic
    RENAME COLUMN efficiency TO avg_efficiency;

ALTER TABLE statistic
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;


CREATE TABLE report (
                        report_id SERIAL PRIMARY KEY,
                        employee_id INT REFERENCES employee(employee_id) ON DELETE CASCADE,
                        line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                        work_date DATE NOT NULL,
                        shift VARCHAR(20),              -- Morning / Afternoon / Night
                        produced_quantity INT,          -- số sản phẩm làm được trong ca
                        downtime_minutes INT,           -- thời gian máy dừng (phút)
                        notes TEXT,                     -- ghi chú sự cố
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
