----------------------
-- USER & AUTH DOMAIN
----------------------

CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       first_name VARCHAR(50) NOT NULL,
                       last_name VARCHAR(50) NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       phone_number VARCHAR(15),
                       status VARCHAR(20) DEFAULT 'active',
                       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee (
                          employee_id SERIAL PRIMARY KEY,
                          user_id INT NOT NULL,
                          employee_code VARCHAR(20) UNIQUE NOT NULL,
                          position VARCHAR(50),
                          employee_type VARCHAR(30) NOT NULL DEFAULT 'WORKER',
                          status VARCHAR(20) DEFAULT 'active',

                          CONSTRAINT fk_employee_user
                              FOREIGN KEY (user_id)
                                  REFERENCES users(user_id)
                                  ON DELETE CASCADE,

                          CONSTRAINT uq_employee_user UNIQUE (user_id)
);

COMMENT ON COLUMN employee.employee_type IS
'WORKER | LINE_LEADER | PLANNER | MANAGER';

CREATE TABLE accounts (
                          account_id SERIAL PRIMARY KEY,
                          user_id INT NOT NULL,
                          employee_id INT,

                          username VARCHAR(100) UNIQUE NOT NULL,
                          password_hash VARCHAR(255) NOT NULL,
                          role VARCHAR(50) NOT NULL,
                          last_login TIMESTAMPTZ,
                          status VARCHAR(20) DEFAULT 'active',
                          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_accounts_user
                              FOREIGN KEY (user_id)
                                  REFERENCES users(user_id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_accounts_employee
                              FOREIGN KEY (employee_id)
                                  REFERENCES employee(employee_id)
                                  ON DELETE CASCADE,

                          CONSTRAINT uq_accounts_user UNIQUE (user_id),
                          CONSTRAINT uq_accounts_employee UNIQUE (employee_id)
);

----------------------
-- PRODUCTION DOMAIN
----------------------

CREATE TABLE production_line (
                                 line_id SERIAL PRIMARY KEY,
                                 line_name VARCHAR(100) NOT NULL,
                                 capacity INT,
                                 shift_hours INT,
                                 efficiency DECIMAL(5,2),
                                 status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE machine (
                         machine_id SERIAL PRIMARY KEY,
                         line_id INT,
                         machine_name VARCHAR(100) NOT NULL,
                         machine_type VARCHAR(50),
                         capacity INT,
                         status VARCHAR(20) DEFAULT 'active',
                         last_maintenance_date TIMESTAMPTZ,
                         created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_machine_line
                             FOREIGN KEY (line_id)
                                 REFERENCES production_line(line_id)
                                 ON DELETE CASCADE
);

----------------------
-- ORDER DOMAIN
----------------------

CREATE TABLE orders (
                        order_id SERIAL PRIMARY KEY,
                        customer_name VARCHAR(100) NOT NULL,
                        product_type VARCHAR(100) NOT NULL,
                        quantity INT NOT NULL,
                        deadline TIMESTAMPTZ,
                        priority VARCHAR(20),
                        status VARCHAR(20) DEFAULT 'Draft',
                        created_by INT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                        CONSTRAINT fk_order_created_by
                            FOREIGN KEY (created_by)
                                REFERENCES users(user_id)
);

CREATE TABLE order_items (
                             item_id SERIAL PRIMARY KEY,
                             order_id INT NOT NULL,
                             product_name VARCHAR(100) NOT NULL,
                             quantity INT NOT NULL,
                             price DECIMAL(10,2),

                             CONSTRAINT fk_order_items_order
                                 FOREIGN KEY (order_id)
                                     REFERENCES orders(order_id)
                                     ON DELETE CASCADE
);

----------------------
-- SCHEDULING DOMAIN
----------------------

CREATE TABLE production_schedule (
                                     schedule_id SERIAL PRIMARY KEY,
                                     order_id INT NOT NULL,
                                     line_id INT NOT NULL,
                                     leader_id INT NOT NULL,
                                     start_time TIMESTAMPTZ,
                                     end_time TIMESTAMPTZ,
                                     status VARCHAR(20) DEFAULT 'Scheduled',

                                     CONSTRAINT fk_schedule_order
                                         FOREIGN KEY (order_id)
                                             REFERENCES orders(order_id)
                                             ON DELETE CASCADE,

                                     CONSTRAINT fk_schedule_line
                                         FOREIGN KEY (line_id)
                                             REFERENCES production_line(line_id)
                                             ON DELETE CASCADE,

                                     CONSTRAINT fk_schedule_leader
                                         FOREIGN KEY (leader_id)
                                             REFERENCES employee(employee_id)
);


CREATE TABLE production_progress (
                                     progress_id SERIAL PRIMARY KEY,
                                     schedule_id INT NOT NULL,
                                     percentage DECIMAL(5,2),
                                     status VARCHAR(20) DEFAULT 'In Progress',

                                     CONSTRAINT fk_progress_schedule
                                         FOREIGN KEY (schedule_id)
                                             REFERENCES production_schedule(schedule_id)
                                             ON DELETE CASCADE
);

----------------------
-- REPORT & STATISTIC
----------------------

CREATE TABLE statistic (
                           statistic_id SERIAL PRIMARY KEY,
                           line_id INT NOT NULL,
                           work_date DATE NOT NULL,
                           total_output INT,
                           total_downtime INT,
                           avg_efficiency DECIMAL(5,2),
                           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT fk_stat_line
                               FOREIGN KEY (line_id)
                                   REFERENCES production_line(line_id)
                                   ON DELETE CASCADE
);

CREATE TABLE report (
                        report_id SERIAL PRIMARY KEY,
                        employee_id INT NOT NULL,
                        line_id INT NOT NULL,
                        schedule_id INT NOT NULL,
                        work_date DATE NOT NULL,
                        shift VARCHAR(20),
                        produced_quantity INT,
                        downtime_minutes INT,
                        notes TEXT,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                        CONSTRAINT fk_report_employee
                            FOREIGN KEY (employee_id)
                                REFERENCES employee(employee_id)
                                ON DELETE CASCADE,

                        CONSTRAINT fk_report_line
                            FOREIGN KEY (line_id)
                                REFERENCES production_line(line_id)
                                ON DELETE CASCADE,

                        CONSTRAINT fk_report_schedule
                            FOREIGN KEY (schedule_id)
                                REFERENCES production_schedule(schedule_id)
                                ON DELETE CASCADE
);

----------------------
-- LOG & NOTIFICATION
----------------------

CREATE TABLE audit_log (
                           log_id SERIAL PRIMARY KEY,
                           user_id INT NOT NULL,
                           action_type VARCHAR(50),
                           entity VARCHAR(100),
                           details TEXT,
                           timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT fk_audit_user
                               FOREIGN KEY (user_id)
                                   REFERENCES users(user_id)
                                   ON DELETE CASCADE
);

CREATE TABLE incident_log (
                              incident_id SERIAL PRIMARY KEY,
                              line_id INT NOT NULL,
                              schedule_id INT NOT NULL,
                              machine_id INT,
                              reported_by INT,
                              incident_type VARCHAR(50),
                              severity VARCHAR(10),
                              description TEXT NOT NULL,
                              timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_incident_line
                                  FOREIGN KEY (line_id)
                                      REFERENCES production_line(line_id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_incident_schedule
                                  FOREIGN KEY (schedule_id)
                                      REFERENCES production_schedule(schedule_id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_incident_machine
                                  FOREIGN KEY (machine_id)
                                      REFERENCES machine(machine_id),

                              CONSTRAINT fk_incident_reporter
                                  FOREIGN KEY (reported_by)
                                      REFERENCES employee(employee_id)
);

CREATE TABLE notification (
                              notification_id SERIAL PRIMARY KEY,
                              user_id INT NOT NULL,
                              message TEXT NOT NULL,
                              status VARCHAR(20) DEFAULT 'unread',
                              timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_notification_user
                                  FOREIGN KEY (user_id)
                                      REFERENCES users(user_id)
                                      ON DELETE CASCADE
);
