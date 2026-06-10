-- Update import template for employees to include all valid employee types
UPDATE import_templates 
SET validation_rules = jsonb_set(
  validation_rules,
  '{employee_type,values}',
  '["staff", "manager", "contractor", "intern", "director", "owner"]'::jsonb
)
WHERE module_name = 'employees';

-- Also update the sample data to reflect a more comprehensive example
UPDATE import_templates 
SET sample_data = '[{
  "first_name": "John",
  "last_name": "Doe", 
  "email": "john.doe@company.com",
  "national_insurance_number": "AB123456C",
  "hire_date": "2024-01-15",
  "phone": "+44 123 456 7890",
  "date_of_birth": "1990-05-15",
  "start_date": "2024-01-15",
  "salary": "50000",
  "employee_type": "staff",
  "status": "active",
  "job_title": "Software Engineer",
  "department": "Engineering",
  "manager_name": "Jane Smith",
  "company_name": "Acme Corporation",
  "sponsored_by_company_name": "",
  "current_nationality": "United Kingdom",
  "street_address": "123 Main Street",
  "address_line_2": "Apt 4B",
  "city": "London",
  "state_province": "Greater London",
  "postal_code": "SW1A 1AA",
  "country_name": "United Kingdom",
  "profile_photo": "",
  "leave_entitlement": "25",
  "remaining_leaves": "25"
}]'::jsonb
WHERE module_name = 'employees';