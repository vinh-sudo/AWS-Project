CREATE TABLE production_plan (
                                 plan_id SERIAL PRIMARY KEY,

                                 order_id INT NOT NULL,
                                 line_id INT NOT NULL,
                                 created_by INT NOT NULL,

                                 planned_quantity INT NOT NULL,
                                 planned_start_date DATE NOT NULL,
                                 planned_end_date DATE,

                                 estimated_hours DOUBLE PRECISION,
                                 estimated_machines INT,

                                 decision VARCHAR(30) NOT NULL,
                                 note TEXT,

                                 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT fk_plan_order
                                     FOREIGN KEY (order_id)
                                         REFERENCES orders(order_id),

                                 CONSTRAINT fk_plan_line
                                     FOREIGN KEY (line_id)
                                         REFERENCES production_line(line_id),

                                 CONSTRAINT fk_plan_manager
                                     FOREIGN KEY (created_by)
                                         REFERENCES employee(employee_id)
);
