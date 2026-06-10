-- Fix the optional_fields array to use manager_name instead of manager_employee_number
UPDATE import_templates 
SET 
  optional_fields = array_replace(optional_fields, 'manager_employee_number', 'manager_name')
WHERE module_name = 'employees' AND id = '7e96d0f1-fc6b-471d-ad1b-9ef1af8dbb5f';