-- =========================
-- V2: ADD INDEXES
-- =========================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Employee
CREATE INDEX idx_employee_user_id ON employee(user_id);
CREATE INDEX idx_employee_code ON employee(employee_code);
CREATE INDEX idx_employee_status ON employee(status);

-- Accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_employee_id ON accounts(employee_id);
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_role ON accounts(role);
CREATE INDEX idx_accounts_status ON accounts(status);

-- Production Line
CREATE INDEX idx_production_line_status ON production_line(status);

-- Machine
CREATE INDEX idx_machine_line_id ON machine(line_id);
CREATE INDEX idx_machine_status ON machine(status);

-- Orders
CREATE INDEX idx_orders_deadline ON orders(deadline);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_priority ON orders(priority);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Production Schedule
CREATE INDEX idx_schedule_order_id ON production_schedule(order_id);
CREATE INDEX idx_schedule_line_id ON production_schedule(line_id);
CREATE INDEX idx_schedule_status ON production_schedule(status);

-- Production Schedule Detail (BỔ SUNG INDEX - bản của bạn thiếu)
CREATE INDEX idx_psd_schedule_id ON production_schedule_detail(schedule_id);
CREATE INDEX idx_psd_machine_id ON production_schedule_detail(machine_id);
CREATE INDEX idx_psd_employee_id ON production_schedule_detail(employee_id);
CREATE INDEX idx_psd_work_date ON production_schedule_detail(work_date);

-- Production Progress
CREATE INDEX idx_progress_schedule_id ON production_progress(schedule_id);

-- Statistic
CREATE INDEX idx_statistic_line_id ON statistic(line_id);
CREATE INDEX idx_statistic_work_date ON statistic(work_date);

-- Report
CREATE INDEX idx_report_employee_id ON report(employee_id);
CREATE INDEX idx_report_line_id ON report(line_id);
CREATE INDEX idx_report_work_date ON report(work_date);

-- Audit Log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity);

-- Incident Log
CREATE INDEX idx_incident_line_id ON incident_log(line_id);

-- Notification
CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_status ON notification(status);
