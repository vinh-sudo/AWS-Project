-- SMT: Gắn linh kiện SMD lên PCB
INSERT INTO production_line (line_name, capacity, shift_hours, efficiency)
VALUES ('SMT Line', 1200, 8, 0.85);

-- DIP: Hàn linh kiện chân dài
INSERT INTO production_line (line_name, capacity, shift_hours, efficiency)
VALUES ('DIP Line', 600, 8, 0.80);

-- Assembly: Lắp module, jack, vỏ
INSERT INTO production_line (line_name, capacity, shift_hours, efficiency)
VALUES ('Assembly Line', 500, 8, 0.90);

-- Testing: Kiểm tra điện, burn-in
INSERT INTO production_line (line_name, capacity, shift_hours, efficiency)
VALUES ('Testing Line', 400, 8, 0.95);

-- Packing: Đóng gói thành phẩm
INSERT INTO production_line (line_name, capacity, shift_hours, efficiency)
VALUES ('Packing Line', 700, 8, 0.92);

-- In kem hàn lên PCB
INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (1, 'Solder Paste Printer', 'STENCIL', 1500, 1);

-- Gắn linh kiện SMD
INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (1, 'Pick & Place Machine', 'PNP', 3000, 3);

-- Hàn linh kiện
INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (1, 'Reflow Oven', 'REFLOW', 2000, 2);

-- Soi lỗi
INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (1, 'AOI Scanner', 'AOI', 1800, 1);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (2, 'Wave Solder Machine', 'WAVE', 800, 1);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (3, 'Assembly Station', 'ASM', 600, 2);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (4, 'ICT Tester', 'ICT', 500, 1);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (4, 'Functional Test Station', 'FUNC', 450, 1);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (4, 'Burn-in Chamber', 'BURNIN', 300, 1);

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity)
VALUES (5, 'Packing Station', 'PACK', 900, 2);
