-- ===== USERS =====
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ===== EMPLOYEE =====
CREATE INDEX idx_employee_user ON employee(user_id);
CREATE INDEX idx_employee_code ON employee(employee_code);

-- ===== ACCOUNTS =====
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_status ON accounts(status);

-- ===== PRODUCTION LINE =====
CREATE INDEX idx_line_status ON production_line(status);

-- ===== MACHINE =====
CREATE INDEX idx_machine_line ON machine(line_id);
CREATE INDEX idx_machine_status ON machine(status);

-- ===== ORDERS =====
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_deadline ON orders(deadline);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ===== ORDER ITEMS =====
CREATE INDEX idx_items_order ON order_items(order_id);

-- ===== PRODUCTION SCHEDULE =====
CREATE INDEX idx_schedule_line ON production_schedule(line_id);
CREATE INDEX idx_schedule_order ON production_schedule(order_id);

-- ===== PRODUCTION PROGRESS =====
CREATE INDEX idx_progress_schedule
    ON production_progress(schedule_id);

-- ===== STATISTIC (COMPOSITE INDEX) =====
CREATE INDEX idx_stat_line_date
    ON statistic(line_id, work_date);

-- ===== REPORT =====
CREATE INDEX idx_report_line_date
    ON report(line_id, work_date);

CREATE INDEX idx_report_employee
    ON report(employee_id);

-- ===== AUDIT LOG =====
CREATE INDEX idx_audit_user
    ON audit_log(user_id);

CREATE INDEX idx_audit_time
    ON audit_log(timestamp);

-- ===== INCIDENT LOG =====
CREATE INDEX idx_incident_line
    ON incident_log(line_id);

CREATE INDEX idx_incident_time
    ON incident_log(timestamp);

-- ===== NOTIFICATION =====
CREATE INDEX idx_noti_user
    ON notification(user_id);

CREATE INDEX idx_noti_status
    ON notification(status);
