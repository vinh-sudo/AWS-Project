
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
                          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                          employee_code VARCHAR(20) UNIQUE NOT NULL,
                          position VARCHAR(50),
                          status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE accounts (
                          account_id SERIAL PRIMARY KEY,
                          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                          employee_code VARCHAR(20) UNIQUE NOT NULL,
                          username VARCHAR(100) UNIQUE NOT NULL,
                          password_hash VARCHAR(255) NOT NULL,
                          role VARCHAR(50) NOT NULL,
                          last_login TIMESTAMPTZ,
                          status VARCHAR(20) DEFAULT 'active',
                          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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
                         line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                         machine_name VARCHAR(100) NOT NULL,
                         machine_type VARCHAR(50),
                         capacity INT,
                         status VARCHAR(20) DEFAULT 'active',
                         last_maintenance_date TIMESTAMPTZ,
                         created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE orders (
                        order_id SERIAL PRIMARY KEY,
                        customer_name VARCHAR(100) NOT NULL,
                        product_type VARCHAR(100) NOT NULL,
                        quantity INT NOT NULL,
                        deadline TIMESTAMPTZ,
                        priority VARCHAR(20),
                        status VARCHAR(20) DEFAULT 'Draft',
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE order_items (
                             item_id SERIAL PRIMARY KEY,
                             order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                             product_name VARCHAR(100) NOT NULL,
                             quantity INT NOT NULL,
                             price DECIMAL(10,2)
);


CREATE TABLE production_schedule (
                                     schedule_id SERIAL PRIMARY KEY,
                                     order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                                     line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                                     start_time TIMESTAMPTZ,
                                     end_time TIMESTAMPTZ,
                                     status VARCHAR(20) DEFAULT 'Scheduled'
);


CREATE TABLE production_progress (
                                     progress_id SERIAL PRIMARY KEY,
                                     schedule_id INT REFERENCES production_schedule(schedule_id) ON DELETE CASCADE,
                                     percentage DECIMAL(5,2),
                                     status VARCHAR(20) DEFAULT 'In Progress'
);


CREATE TABLE statistic (
                           statistic_id SERIAL PRIMARY KEY,
                           line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                           work_date DATE NOT NULL,
                           total_output INT,
                           total_downtime INT,
                           avg_efficiency DECIMAL(5,2),
                           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE report (
                        report_id SERIAL PRIMARY KEY,
                        employee_id INT REFERENCES employee(employee_id) ON DELETE CASCADE,
                        line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                        work_date DATE NOT NULL,
                        shift VARCHAR(20),
                        produced_quantity INT,
                        downtime_minutes INT,
                        notes TEXT,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
                           log_id SERIAL PRIMARY KEY,
                           user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                           action_type VARCHAR(50),
                           entity VARCHAR(100),
                           details TEXT,
                           timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE incident_log (
                              incident_id SERIAL PRIMARY KEY,
                              line_id INT REFERENCES production_line(line_id) ON DELETE CASCADE,
                              description TEXT NOT NULL,
                              timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE notification (
                              notification_id SERIAL PRIMARY KEY,
                              user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                              message TEXT NOT NULL,
                              status VARCHAR(20) DEFAULT 'unread',
                              timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
