-- Update companies import template to use country name lookup
UPDATE import_templates 
SET 
  field_mappings = '{
    "name": "Company Name",
    "company_code": "Company Code", 
    "parent_company_name": "Parent Company Name",
    "email": "Email",
    "phone": "Phone",
    "street_address": "Street Address",
    "city": "City",
    "state_province": "State/Province", 
    "postal_code": "Postal Code",
    "country_name": "Country Name",
    "website": "Website",
    "registration_number": "Registration Number",
    "tax_number": "Tax Number",
    "description": "Description",
    "has_sponsor_license": "Has Sponsor License"
  }'::jsonb,
  sample_data = '[
    {
      "name": "Acme Subsidiary Ltd",
      "company_code": "ACME002",
      "parent_company_name": "Acme Corporation",
      "email": "subsidiary@acme.com",
      "phone": "+44 020 7946 0959",
      "street_address": "456 Business Avenue",
      "city": "Manchester", 
      "state_province": "Greater Manchester",
      "postal_code": "M1 1AA",
      "country_name": "United Kingdom",
      "website": "https://subsidiary.acme.com",
      "registration_number": "87654321",
      "tax_number": "GB987654321",
      "description": "Subsidiary company",
      "has_sponsor_license": "false"
    }
  ]'::jsonb,
  optional_fields = ARRAY['company_code', 'parent_company_name', 'email', 'phone', 'street_address', 'city', 'state_province', 'postal_code', 'country_name', 'website', 'registration_number', 'tax_number', 'description', 'has_sponsor_license'],
  updated_at = now()
WHERE module_name = 'companies';