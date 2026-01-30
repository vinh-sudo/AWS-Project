
-- 1. Add columns to production_schedule (safe)
ALTER TABLE production_schedule
    ADD COLUMN IF NOT EXISTS machine_id INT;

ALTER TABLE production_schedule
    ADD COLUMN IF NOT EXISTS plan_id INT;

-- 2. Drop old constraints if exist
ALTER TABLE production_schedule
    DROP CONSTRAINT IF EXISTS fk_schedule_machine;

ALTER TABLE production_schedule
    DROP CONSTRAINT IF EXISTS fk_schedule_plan;

-- 3. Recreate correct foreign keys
ALTER TABLE production_schedule
    ADD CONSTRAINT fk_schedule_machine
        FOREIGN KEY (machine_id)
            REFERENCES machine(machine_id)
            ON DELETE CASCADE;

ALTER TABLE production_schedule
    ADD CONSTRAINT fk_schedule_plan
        FOREIGN KEY (plan_id)
            REFERENCES production_plan(plan_id)
            ON DELETE CASCADE;

-- 4. Reset line leader assignment (DEV MODE)
DROP TABLE IF EXISTS line_leader_assignment CASCADE;

CREATE TABLE IF NOT EXISTS line_leader_assignment (
                                                      assignment_id BIGSERIAL PRIMARY KEY,
                                                      line_id INT NOT NULL,
                                                      leader_id INT NOT NULL,
                                                      start_date TIMESTAMPTZ NOT NULL,
                                                      end_date TIMESTAMPTZ NULL,
                                                      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                                                      CONSTRAINT fk_assignment_line
                                                          FOREIGN KEY (line_id)
                                                              REFERENCES production_line(line_id)
                                                              ON DELETE CASCADE,

                                                      CONSTRAINT fk_assignment_leader
                                                          FOREIGN KEY (leader_id)
                                                              REFERENCES employee(employee_id)
                                                              ON DELETE CASCADE
);
