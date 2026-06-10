-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(nextval('employee_number_seq')::TEXT, 5, '0');
END;
$$;