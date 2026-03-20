-- V24: add composite index for schedule overlap checks
-- Tối ưu truy vấn kiểm tra trùng lịch theo machine + start_time

CREATE INDEX IF NOT EXISTS idx_schedule_machine_start_time
    ON production_schedule(machine_id, start_time);

