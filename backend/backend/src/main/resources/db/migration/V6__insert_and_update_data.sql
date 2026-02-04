ALTER TABLE machine ADD COLUMN machine_code VARCHAR(100) UNIQUE;

INSERT INTO machine (line_id, machine_name, machine_type, capacity, quantity, machine_code)
VALUES
    (2, 'Lead Cutter', 'CUTTER', 1000, 1, 'CUTTER-DIP-01'),
    (2, 'Inspection Station', 'INSPECT', 700, 1, 'INSPECT-DIP-01'),
    (3, 'Screwing Machine', 'SCREW', 500, 1, 'SCREW-ASM-01'),
    (3, 'Inspection Station', 'INSPECT', 500, 1, 'INSPECT-ASM-01'),
    (5, 'Label Machine', 'LABEL', 800, 1, 'LABEL-PACK-01'),
    (5, 'Sealing Machine', 'SEAL', 900, 1, 'SEAL-PACK-01');

UPDATE machine SET machine_code = 'PRINTER-SMT-01' WHERE machine_name = 'Solder Paste Printer';

UPDATE machine SET machine_code = 'PNP-SMT-01'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_type = 'PNP' AND line_id = 1 ORDER BY machine_id LIMIT 1);

UPDATE machine SET machine_code = 'PNP-SMT-02'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_type = 'PNP' AND line_id = 1 ORDER BY machine_id LIMIT 1 OFFSET 1);

UPDATE machine SET machine_code = 'PNP-SMT-03'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_type = 'PNP' AND line_id = 1 ORDER BY machine_id LIMIT 1 OFFSET 2);

UPDATE machine SET machine_code = 'REFLOW-SMT-01'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_type = 'REFLOW' AND line_id = 1 ORDER BY machine_id LIMIT 1);

UPDATE machine SET machine_code = 'REFLOW-SMT-02'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_type = 'REFLOW' AND line_id = 1 ORDER BY machine_id LIMIT 1 OFFSET 1);

UPDATE machine SET machine_code = 'AOI-SMT-01' WHERE machine_name = 'AOI Scanner';

UPDATE machine SET machine_code = 'WAVE-DIP-01' WHERE machine_name = 'Wave Solder Machine';

UPDATE machine SET machine_code = 'ASM-01'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_name = 'Assembly Station' ORDER BY machine_id LIMIT 1);

UPDATE machine SET machine_code = 'ASM-02'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_name = 'Assembly Station' ORDER BY machine_id LIMIT 1 OFFSET 1);

UPDATE machine SET machine_code = 'ICT-TEST-01' WHERE machine_name = 'ICT Tester';

UPDATE machine SET machine_code = 'FUNC-TEST-01' WHERE machine_name = 'Functional Test Station';

UPDATE machine SET machine_code = 'BURNIN-TEST-01' WHERE machine_name = 'Burn-in Chamber';

UPDATE machine SET machine_code = 'PACK-01'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_name = 'Packing Station' ORDER BY machine_id LIMIT 1);

UPDATE machine SET machine_code = 'PACK-02'
WHERE machine_id = (SELECT machine_id FROM machine WHERE machine_name = 'Packing Station' ORDER BY machine_id LIMIT 1 OFFSET 1);