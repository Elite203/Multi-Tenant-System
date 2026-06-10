-- Create sequence for employee numbers
CREATE SEQUENCE employee_number_seq START 1;

-- Create function to generate formatted employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(nextval('employee_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint on employee_number
ALTER TABLE employees ADD CONSTRAINT employees_employee_number_unique UNIQUE (employee_number);

-- Set default value for employee_number
ALTER TABLE employees ALTER COLUMN employee_number SET DEFAULT generate_employee_number();

-- Update existing employee to new format (EMP001 -> 00001)
UPDATE employees SET employee_number = '00001' WHERE employee_number = 'EMP001';

-- Reset sequence to start from 2 (since 00001 is now taken)
SELECT setval('employee_number_seq', 2);