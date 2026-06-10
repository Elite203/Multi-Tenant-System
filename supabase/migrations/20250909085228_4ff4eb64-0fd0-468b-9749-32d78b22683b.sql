-- Update the employees import template to use manager name instead of employee number
UPDATE import_templates 
SET 
  field_mappings = jsonb_set(
    field_mappings - 'manager_employee_number',
    '{manager_name}',
    '"Manager Name (Lookup)"'
  ),
  sample_data = jsonb_set(
    sample_data - 'manager_employee_number',
    '{manager_name}',
    '"John Smith"'
  )
WHERE module_name = 'employees' AND display_name = 'Employee Data Import';