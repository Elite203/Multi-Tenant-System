-- Add comprehensive system settings for all categories
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
-- General Settings
('app_name', '{"value": "HR Management System"}', 'Application name displayed in header and emails'),
('app_logo_url', '{"value": ""}', 'URL to application logo image'),
('company_contact_email', '{"value": "admin@company.com"}', 'Main company contact email address'),
('company_contact_phone', '{"value": ""}', 'Main company contact phone number'),
('company_address', '{"value": ""}', 'Company physical address'),
('default_timezone', '{"value": "UTC"}', 'Default timezone for the application'),
('support_email', '{"value": "support@company.com"}', 'Support contact email'),

-- Leave Settings
('default_annual_leave_days', '{"value": 25}', 'Default annual leave allocation in days'),
('leave_carry_over_limit', '{"value": 5}', 'Maximum days that can be carried over to next year'),
('leave_approval_workflow', '{"value": "manager_only"}', 'Leave approval workflow: manager_only, hr_approval, or manager_then_hr'),
('leave_notice_period_days', '{"value": 14}', 'Minimum notice period for leave requests in days'),
('probation_leave_entitlement', '{"value": 0}', 'Leave entitlement during probation period'),

-- Employee Settings
('default_probation_period_months', '{"value": 6}', 'Default probation period in months'),
('employee_number_prefix', '{"value": "EMP"}', 'Prefix for auto-generated employee numbers'),
('require_manager_assignment', '{"value": true}', 'Whether employees must have a manager assigned'),
('departments', '{"value": ["Human Resources", "Engineering", "Sales", "Marketing", "Finance", "Operations"]}', 'List of available departments'),
('job_titles', '{"value": ["Software Engineer", "Senior Software Engineer", "Manager", "Director", "HR Specialist", "Sales Representative", "Marketing Manager", "Financial Analyst"]}', 'List of available job titles'),

-- Email Settings
('smtp_host', '{"value": ""}', 'SMTP server hostname'),
('smtp_port', '{"value": 587}', 'SMTP server port'),
('smtp_username', '{"value": ""}', 'SMTP authentication username'),
('smtp_password', '{"value": ""}', 'SMTP authentication password (encrypted)'),
('smtp_use_tls', '{"value": true}', 'Whether to use TLS for SMTP connection'),
('email_from_name', '{"value": "HR System"}', 'Default sender name for system emails'),
('email_from_address', '{"value": "noreply@company.com"}', 'Default sender email address'),

-- Country Settings
('supported_countries', '{"value": ["United Kingdom", "United States", "Canada", "Australia"]}', 'List of countries supported by the system'),
('default_country', '{"value": "United Kingdom"}', 'Default country for new employees'),
('default_currency', '{"value": "GBP"}', 'Default currency code'),
('holiday_calendar_country', '{"value": "UK"}', 'Country code for holiday calendar integration'),

-- Visa Settings
('visa_types', '{"value": ["Skilled Worker", "Student", "Visitor", "Family", "EU Settled Status", "EU Pre-Settled Status", "Indefinite Leave to Remain", "Temporary Worker"]}', 'Available visa types'),
('visa_expiry_notification_days', '{"value": [90, 30, 7]}', 'Days before visa expiry to send notifications'),
('require_sponsorship_license', '{"value": true}', 'Whether sponsorship license tracking is required'),
('default_sponsor_license', '{"value": ""}', 'Default sponsorship license number'),

-- Rota Settings (future ready)
('shift_types', '{"value": ["Day Shift", "Night Shift", "Weekend", "On-Call"]}', 'Available shift types'),
('default_shift_duration_hours', '{"value": 8}', 'Default shift duration in hours'),
('locations', '{"value": ["Head Office", "Branch Office", "Remote", "Client Site"]}', 'Available work locations'),
('enable_rota_module', '{"value": false}', 'Whether rota/scheduling module is enabled')

ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description,
updated_at = now();