-- Split address field into individual components for employees table
ALTER TABLE public.employees 
ADD COLUMN street_address text,
ADD COLUMN address_line_2 text,
ADD COLUMN city text,
ADD COLUMN state_province text,
ADD COLUMN postal_code text,
ADD COLUMN country_id uuid REFERENCES public.countries(id);

-- Update employees import template to include all missing fields
UPDATE import_templates 
SET 
  field_mappings = '{
    "first_name": "First Name",
    "last_name": "Last Name", 
    "email": "Email",
    "phone": "Phone",
    "national_insurance_number": "National Insurance Number",
    "date_of_birth": "Date of Birth",
    "hire_date": "Hire Date",
    "start_date": "Start Date",
    "salary": "Salary",
    "employee_type": "Employee Type",
    "status": "Status",
    "job_title": "Job Title",
    "department": "Department",
    "manager_employee_number": "Manager Employee Number",
    "company_name": "Company Name",
    "sponsored_by_company_name": "Sponsored By Company",
    "current_nationality": "Current Nationality",
    "street_address": "Street Address",
    "address_line_2": "Address Line 2",
    "city": "City",
    "state_province": "State/Province",
    "postal_code": "Postal Code",
    "country_name": "Country",
    "leave_entitlement": "Leave Entitlement",
    "remaining_leaves": "Remaining Leaves",
    "profile_photo": "Profile Photo URL"
  }'::jsonb,
  sample_data = '[
    {
      "first_name": "John",
      "last_name": "Doe", 
      "email": "john.doe@company.com",
      "phone": "+44 123 456 7890",
      "national_insurance_number": "AB123456C",
      "date_of_birth": "1990-05-15",
      "hire_date": "2024-01-15",
      "start_date": "2024-01-15",
      "salary": "50000",
      "employee_type": "staff",
      "status": "active",
      "job_title": "Software Engineer",
      "department": "Engineering",
      "manager_employee_number": "00001",
      "company_name": "Acme Corporation",
      "sponsored_by_company_name": "",
      "current_nationality": "United Kingdom",
      "street_address": "123 Main Street",
      "address_line_2": "Apt 4B",
      "city": "London",
      "state_province": "Greater London",
      "postal_code": "SW1A 1AA",
      "country_name": "United Kingdom",
      "leave_entitlement": "25",
      "remaining_leaves": "25",
      "profile_photo": ""
    }
  ]'::jsonb,
  required_fields = ARRAY['first_name', 'last_name', 'email', 'national_insurance_number', 'hire_date'],
  optional_fields = ARRAY['phone', 'date_of_birth', 'start_date', 'salary', 'employee_type', 'status', 'job_title', 'department', 'manager_employee_number', 'company_name', 'sponsored_by_company_name', 'current_nationality', 'street_address', 'address_line_2', 'city', 'state_province', 'postal_code', 'country_name', 'leave_entitlement', 'remaining_leaves', 'profile_photo'],
  updated_at = now()
WHERE module_name = 'employees';