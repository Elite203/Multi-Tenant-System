-- Update the employee import template to improve manager lookup documentation and validation
UPDATE import_templates 
SET 
  validation_rules = jsonb_set(
    validation_rules,
    '{manager_employee_number}',
    '{"type": "lookup", "table": "employees", "field": "employee_number", "description": "Must match an existing active employee number"}'::jsonb
  ),
  field_mappings = jsonb_set(
    field_mappings,
    '{manager_employee_number}',
    '"Manager Employee Number (Lookup)"'::jsonb
  ),
  description = 'Import employee data with personal and employment information. Manager field uses employee number lookup.'
WHERE module_name = 'employees';

-- Add a note about manager lookup in sample data
UPDATE import_templates 
SET sample_data = jsonb_set(
  sample_data,
  '{0,manager_employee_number}',
  '"EMP001"'::jsonb
)
WHERE module_name = 'employees';