-- Update companies import template with individual address fields and parent company
UPDATE import_templates 
SET 
  display_name = 'Companies',
  description = 'Import company data with individual address fields and parent company support',
  required_fields = ARRAY['name'],
  optional_fields = ARRAY['company_code', 'parent_company_id', 'email', 'phone', 'street_address', 'city', 'state_province', 'postal_code', 'country_id', 'website', 'registration_number', 'tax_number', 'description', 'has_sponsor_license'],
  field_mappings = '{
    "name": "Company Name",
    "company_code": "Company Code", 
    "parent_company_id": "Parent Company ID",
    "email": "Email",
    "phone": "Phone",
    "street_address": "Street Address",
    "city": "City",
    "state_province": "State/Province", 
    "postal_code": "Postal Code",
    "country_id": "Country ID",
    "website": "Website",
    "registration_number": "Registration Number",
    "tax_number": "Tax Number",
    "description": "Description",
    "has_sponsor_license": "Has Sponsor License"
  }'::jsonb,
  sample_data = '[
    {
      "name": "Acme Corporation",
      "company_code": "ACME001",
      "parent_company_id": "",
      "email": "info@acme.com",
      "phone": "+44 020 7946 0958",
      "street_address": "123 Business Street",
      "city": "London", 
      "state_province": "Greater London",
      "postal_code": "EC1A 1BB",
      "country_id": "",
      "website": "https://acme.com",
      "registration_number": "12345678",
      "tax_number": "GB123456789",
      "description": "Leading technology company",
      "has_sponsor_license": "false"
    }
  ]'::jsonb,
  validation_rules = '{
    "email": {"type": "email"},
    "website": {"type": "url"},
    "parent_company_id": {"type": "uuid", "nullable": true},
    "country_id": {"type": "uuid", "nullable": true},
    "has_sponsor_license": {"type": "boolean"}
  }'::jsonb,
  updated_at = now()
WHERE module_name = 'companies';