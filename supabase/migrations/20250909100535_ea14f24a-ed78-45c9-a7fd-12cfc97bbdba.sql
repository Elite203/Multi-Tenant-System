-- Update leave_requests import template with better enum validation
UPDATE import_templates 
SET validation_rules = '{
  "employee_email": {
    "type": "email",
    "description": "Must be a valid email of an existing employee"
  },
  "leave_type": {
    "type": "enum",
    "values": ["annual", "sick", "personal", "maternity", "paternity"],
    "case_insensitive": true,
    "description": "Leave type - case insensitive"
  },
  "start_date": {
    "type": "date",
    "format": "YYYY-MM-DD",
    "description": "Leave start date"
  },
  "end_date": {
    "type": "date", 
    "format": "YYYY-MM-DD",
    "description": "Leave end date"
  },
  "days_requested": {
    "type": "number",
    "min": 0.5,
    "description": "Number of days requested (minimum 0.5)"
  },
  "reason": {
    "type": "string",
    "description": "Reason for leave request"
  }
}'::jsonb
WHERE module_name = 'leave_requests';

-- Update employees import template with consistent enum validation
UPDATE import_templates 
SET validation_rules = jsonb_set(
  validation_rules,
  '{employee_type}',
  '{
    "type": "enum",
    "values": ["staff", "manager", "contractor", "intern"],
    "case_insensitive": true,
    "description": "Employee type - case insensitive"
  }'::jsonb
)
WHERE module_name = 'employees';

UPDATE import_templates 
SET validation_rules = jsonb_set(
  validation_rules,
  '{status}',
  '{
    "type": "enum", 
    "values": ["active", "inactive", "terminated", "archived"],
    "case_insensitive": true,
    "description": "Employee status - case insensitive"
  }'::jsonb
)
WHERE module_name = 'employees';