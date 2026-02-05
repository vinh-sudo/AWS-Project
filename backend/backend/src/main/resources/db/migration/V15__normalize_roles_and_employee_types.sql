-- Normalize roles to UPPERCASE
UPDATE accounts 
SET role = UPPER(TRIM(role));

-- Normalize employee_type to UPPERCASE  
UPDATE employee 
SET employee_type = UPPER(TRIM(employee_type));

-- Fix LINE_LEADER employees
UPDATE employee e
SET employee_type = 'LINE_LEADER'
FROM accounts a
WHERE e.employee_id = a.employee_id 
AND a.role = 'LINE_LEADER'
AND e.employee_type = 'WORKER';

-- Fix PRODUCTION_PLANNER employees
UPDATE employee e
SET employee_type = 'PLANNER'
FROM accounts a
WHERE e.employee_id = a.employee_id 
AND a.role = 'PRODUCTION_PLANNER'
AND e.employee_type = 'WORKER';