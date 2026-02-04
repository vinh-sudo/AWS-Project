-- =====================================================
-- V12: ADD INDEXES (PHÙ HỢP HOÀN TOÀN VỚI V1 CUỐI CÙNG)
-- =====================================================

----------------------
-- USERS & AUTH
----------------------

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_status
    ON users(status);

CREATE INDEX IF NOT EXISTS idx_employee_user_id
    ON employee(user_id);

CREATE INDEX IF NOT EXISTS idx_employee_code
    ON employee(employee_code);

CREATE INDEX IF NOT EXISTS idx_employee_status
    ON employee(status);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id
    ON accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_employee_id
    ON accounts(employee_id);

CREATE INDEX IF NOT EXISTS idx_accounts_username
    ON accounts(username);

CREATE INDEX IF NOT EXISTS idx_accounts_role
    ON accounts(role);

CREATE INDEX IF NOT EXISTS idx_accounts_status
    ON accounts(status);

----------------------
-- PRODUCTION DOMAIN
----------------------

CREATE INDEX IF NOT EXISTS idx_production_line_status
    ON production_line(status);

CREATE INDEX IF NOT EXISTS idx_machine_line_id
    ON machine(line_id);

CREATE INDEX IF NOT EXISTS idx_machine_status
    ON machine(status);

----------------------
-- ORDER DOMAIN
----------------------

CREATE INDEX IF NOT EXISTS idx_orders_deadline
    ON orders(deadline);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_priority
    ON orders(priority);

CREATE INDEX IF NOT EXISTS idx_orders_created_by
    ON orders(created_by);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items(order_id);

----------------------
-- SCHEDULING DOMAIN
----------------------

CREATE INDEX IF NOT EXISTS idx_schedule_order_id
    ON production_schedule(order_id);

-- Commented out: columns don't exist in current schema
-- CREATE INDEX IF NOT EXISTS idx_schedule_line_id
--     ON production_schedule(line_id);

-- CREATE INDEX IF NOT EXISTS idx_schedule_leader_id
--     ON production_schedule(leader_id);

CREATE INDEX IF NOT EXISTS idx_schedule_status
    ON production_schedule(status);

CREATE INDEX IF NOT EXISTS idx_schedule_start_time
    ON production_schedule(start_time);

-- Commented out: table may not exist
-- CREATE INDEX IF NOT EXISTS idx_progress_schedule_id
--     ON production_progress(schedule_id);

-- CREATE INDEX IF NOT EXISTS idx_progress_status
--     ON production_progress(status);

----------------------
-- REPORT & STATISTIC
----------------------

-- Commented out: table may not exist
-- CREATE INDEX IF NOT EXISTS idx_statistic_line_id
--     ON statistic(line_id);

-- CREATE INDEX IF NOT EXISTS idx_statistic_work_date
--     ON statistic(work_date);

-- Composite index cho dashboard (quan trọng)
-- CREATE INDEX IF NOT EXISTS idx_statistic_line_date
--     ON statistic(line_id, work_date);

-- CREATE INDEX IF NOT EXISTS idx_report_employee_id
--     ON report(employee_id);

-- CREATE INDEX IF NOT EXISTS idx_report_line_id
--     ON report(line_id);

-- CREATE INDEX IF NOT EXISTS idx_report_schedule_id
--     ON report(schedule_id);

-- CREATE INDEX IF NOT EXISTS idx_report_work_date
--     ON report(work_date);

-- Composite index cho báo cáo
-- CREATE INDEX IF NOT EXISTS idx_report_line_date
--     ON report(line_id, work_date);

----------------------
-- LOG & NOTIFICATION
----------------------

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
    ON audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
    ON audit_log(entity);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
    ON audit_log(timestamp);

CREATE INDEX IF NOT EXISTS idx_incident_line_id
    ON incident_log(line_id);

-- CREATE INDEX IF NOT EXISTS idx_incident_schedule_id
--     ON incident_log(schedule_id);

CREATE INDEX IF NOT EXISTS idx_incident_machine_id
    ON incident_log(machine_id);

CREATE INDEX IF NOT EXISTS idx_incident_reported_by
    ON incident_log(reported_by);

-- Commented out: table may not exist
-- CREATE INDEX IF NOT EXISTS idx_notification_user_id
--     ON notification(user_id);

-- CREATE INDEX IF NOT EXISTS idx_notification_status
--     ON notification(status);
