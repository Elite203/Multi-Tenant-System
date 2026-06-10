-- Fix the employees import template to use manager name instead of employee number
UPDATE import_templates 
SET 
  field_mappings = jsonb_set(
    jsonb_set(
      field_mappings,
      '{manager_name}',
      '"Manager Name (Lookup)"'
    ),
    '{manager_employee_number}',
    'null'
  ) - 'manager_employee_number',
  
  sample_data = jsonb_set(
    jsonb_set(
      sample_data,
      '{0,manager_name}',
      '"John Smith"'
    ),
    '{0,manager_employee_number}',
    'null'
  ) #- '{0,manager_employee_number}',
  
  validation_rules = jsonb_set(
    jsonb_set(
      validation_rules,
      '{manager_name}',
      '{"type": "lookup", "table": "employees", "field": "first_name,last_name", "description": "Must match an existing active employee full name"}'
    ),
    '{manager_employee_number}',
    'null'
  ) - 'manager_employee_number'
  
WHERE module_name = 'employees' AND id = '7e96d0f1-fc6b-471d-ad1b-9ef1af8dbb5f';