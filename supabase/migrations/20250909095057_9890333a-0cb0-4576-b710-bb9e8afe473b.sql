-- Update the employee import template to include proper enum validation rules
UPDATE import_templates 
SET validation_rules = jsonb_set(
  jsonb_set(
    validation_rules,
    '{status}',
    '{
      "type": "enum",
      "values": ["active", "inactive", "terminated", "archived"],
      "case_insensitive": true,
      "description": "Employee status - case insensitive"
    }'::jsonb
  ),
  '{employee_type}',
  '{
    "type": "enum", 
    "values": ["staff", "manager", "contractor", "intern"],
    "case_insensitive": true,
    "description": "Employee type - case insensitive"
  }'::jsonb
)
WHERE module_name = 'employees';