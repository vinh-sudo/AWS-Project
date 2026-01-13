CREATE TABLE "User" (
                        user_id SERIAL PRIMARY KEY,
                        first_name VARCHAR(50) NOT NULL,
                        last_name VARCHAR(50) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        phone_number VARCHAR(15),
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR(20) DEFAULT 'active'
);
CREATE TABLE "Account" (
                           account_id SERIAL PRIMARY KEY,
                           user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
                           username VARCHAR(100) UNIQUE NOT NULL,
                           password_hash VARCHAR(255) NOT NULL,
                           role VARCHAR(50) NOT NULL,
                           last_login TIMESTAMPTZ,
                           status VARCHAR(20) DEFAULT 'active',
                           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Machine" (
                           machine_id SERIAL PRIMARY KEY,
                           line_id INT REFERENCES "ProductionLine"(line_id) ON DELETE CASCADE,
                           machine_name VARCHAR(100) NOT NULL,
                           machine_type VARCHAR(50),
                           capacity INT,
                           status VARCHAR(20) DEFAULT 'active',
                           last_maintenance_date TIMESTAMPTZ,
                           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "ProductionLine" (
                                  line_id SERIAL PRIMARY KEY,
                                  line_name VARCHAR(100) NOT NULL,
                                  capacity INT,
                                  shift_hours INT,
                                  efficiency DECIMAL(5, 2),
                                  status VARCHAR(20) DEFAULT 'active'
);
CREATE TABLE "ProductionSchedule" (
                                      schedule_id SERIAL PRIMARY KEY,
                                      order_id INT REFERENCES "Order"(order_id) ON DELETE CASCADE,
                                      line_id INT REFERENCES "ProductionLine"(line_id) ON DELETE CASCADE,
                                      start_time TIMESTAMPTZ,
                                      end_time TIMESTAMPTZ,
                                      status VARCHAR(20) DEFAULT 'Scheduled'
);
CREATE TABLE "ProductionProgress" (
                                      progress_id SERIAL PRIMARY KEY,
                                      schedule_id INT REFERENCES "ProductionSchedule"(schedule_id) ON DELETE CASCADE,
                                      percentage DECIMAL(5, 2),
                                      status VARCHAR(20) DEFAULT 'In Progress'
);
CREATE TABLE "Order" (
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
CREATE TABLE "OrderItems" (
                              item_id SERIAL PRIMARY KEY,
                              order_id INT REFERENCES "Order"(order_id) ON DELETE CASCADE,
                              product_name VARCHAR(100) NOT NULL,
                              quantity INT NOT NULL,
                              price DECIMAL(10, 2)
);
CREATE TABLE "AuditLog" (
                            log_id SERIAL PRIMARY KEY,
                            user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
                            action_type VARCHAR(50),
                            entity VARCHAR(100),
                            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                            details TEXT
);
CREATE TABLE "IncidentLog" (
                               incident_id SERIAL PRIMARY KEY,
                               line_id INT REFERENCES "ProductionLine"(line_id) ON DELETE CASCADE,
                               description TEXT NOT NULL,
                               timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Notification" (
                                notification_id SERIAL PRIMARY KEY,
                                user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
                                message TEXT NOT NULL,
                                status VARCHAR(20) DEFAULT 'unread',
                                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Statistic" (
                             statistic_id SERIAL PRIMARY KEY,
                             line_id INT REFERENCES "ProductionLine"(line_id) ON DELETE CASCADE,
                             date DATE NOT NULL,
                             output INT,
                             downtime INT,
                             efficiency DECIMAL(5, 2)
);
CREATE TABLE "Report" (
                          report_id SERIAL PRIMARY KEY,
                          report_type VARCHAR(50),
                          generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                          data TEXT
);
