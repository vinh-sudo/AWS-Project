-- 1. Drop FK cũ trên production_schedule
ALTER TABLE production_schedule
    DROP CONSTRAINT IF EXISTS production_schedule_ibfk_3;

-- 2. Drop cột leader_id
ALTER TABLE production_schedule
    DROP COLUMN IF EXISTS leader_id;

-- 3. Tạo bảng line_leader_assignment
CREATE TABLE IF NOT EXISTS line_leader_assignment (
                                                      assignment_id BIGSERIAL PRIMARY KEY,

                                                      line_id BIGINT NOT NULL,
                                                      leader_id BIGINT NOT NULL,

                                                      start_date TIMESTAMP NOT NULL,
                                                      end_date TIMESTAMP NULL,

                                                      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

                                                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                                      CONSTRAINT fk_assignment_line
                                                          FOREIGN KEY (line_id)
                                                              REFERENCES production_line(line_id),

                                                      CONSTRAINT fk_assignment_leader
                                                          FOREIGN KEY (leader_id)
                                                              REFERENCES employee(employee_id),

                                                      CONSTRAINT uq_line_active
                                                          UNIQUE (line_id, status)
);
