--------------------------------------------------
-- V3: ADD SCHEDULE DETAIL + ENFORCE 1 USER = 1 ACCOUNT
--------------------------------------------------


CREATE TABLE production_schedule_detail (
                                            detail_id SERIAL PRIMARY KEY,

                                            schedule_id INT
                                                REFERENCES production_schedule(schedule_id)
                                                    ON DELETE CASCADE,

                                            machine_id INT
                                                REFERENCES machine(machine_id)
                                                    ON DELETE CASCADE,

                                            employee_id INT
                                                REFERENCES employee(employee_id)
                                                    ON DELETE CASCADE,

                                            work_date DATE NOT NULL,
                                            shift VARCHAR(20),      -- MORNING / AFTERNOON / NIGHT
                                            start_time TIME,
                                            end_time TIME
);


CREATE INDEX idx_sched_detail_schedule
    ON production_schedule_detail(schedule_id);


CREATE INDEX idx_sched_detail_employee
    ON production_schedule_detail(employee_id);


CREATE INDEX idx_sched_detail_machine
    ON production_schedule_detail(machine_id);


CREATE INDEX idx_sched_detail_date
    ON production_schedule_detail(work_date);


CREATE INDEX idx_sched_detail_composite
    ON production_schedule_detail(schedule_id, work_date, shift);


ALTER TABLE accounts
    ADD CONSTRAINT uq_accounts_user UNIQUE (user_id);


