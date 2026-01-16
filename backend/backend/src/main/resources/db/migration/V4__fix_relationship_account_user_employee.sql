
ALTER TABLE employee
ADD CONSTRAINT uq_employee_user UNIQUE (user_id);

ALTER TABLE accounts
ADD CONSTRAINT fk_account_employee_code
FOREIGN KEY (employee_code)
REFERENCES employee(employee_code)
ON DELETE CASCADE;
