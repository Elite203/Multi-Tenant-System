-- Create import templates table
CREATE TABLE public.import_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  field_mappings JSONB NOT NULL DEFAULT '{}',
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  optional_fields TEXT[] NOT NULL DEFAULT '{}',
  validation_rules JSONB NOT NULL DEFAULT '{}',
  sample_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import jobs table
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.import_templates(id),
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  success_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  warning_rows INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_summary JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import previews table  
CREATE TABLE public.import_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  preview_data JSONB NOT NULL DEFAULT '{}',
  validation_results JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import errors table
CREATE TABLE public.import_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import_templates
CREATE POLICY "Admins can manage import templates" ON public.import_templates
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view active templates" ON public.import_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for import_jobs  
CREATE POLICY "Admins can manage all import jobs" ON public.import_jobs
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own import jobs" ON public.import_jobs
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for import_previews
CREATE POLICY "Admins can manage all import previews" ON public.import_previews
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own import previews" ON public.import_previews  
  FOR SELECT USING (
    job_id IN (SELECT id FROM public.import_jobs WHERE user_id = auth.uid())
  );

-- RLS Policies for import_errors
CREATE POLICY "Admins can manage all import errors" ON public.import_errors
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own import errors" ON public.import_errors
  FOR SELECT USING (
    job_id IN (SELECT id FROM public.import_jobs WHERE user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_import_previews_expires_at ON public.import_previews(expires_at);
CREATE INDEX idx_import_errors_job_id ON public.import_errors(job_id);

-- Insert default templates
INSERT INTO public.import_templates (module_name, display_name, description, field_mappings, required_fields, optional_fields, validation_rules, sample_data) VALUES
('employees', 'Employees', 'Import employee data with personal and employment information', 
 '{"first_name": "First Name", "last_name": "Last Name", "email": "Email", "phone": "Phone", "hire_date": "Hire Date", "job_title": "Job Title", "department": "Department", "salary": "Salary"}',
 ARRAY['first_name', 'last_name', 'email', 'national_insurance_number'],
 ARRAY['phone', 'hire_date', 'job_title', 'department', 'salary', 'address', 'date_of_birth'],
 '{"email": {"type": "email"}, "hire_date": {"type": "date", "format": "YYYY-MM-DD"}, "date_of_birth": {"type": "date", "format": "YYYY-MM-DD"}, "salary": {"type": "number", "min": 0}}',
 '[{"first_name": "John", "last_name": "Doe", "email": "john.doe@company.com", "phone": "+44 123 456 7890", "hire_date": "2024-01-15", "job_title": "Software Engineer", "department": "Engineering", "salary": "50000", "national_insurance_number": "AB123456C"}]'),
 
('companies', 'Companies', 'Import company data with contact and address information',
 '{"name": "Company Name", "email": "Email", "phone": "Phone", "address": "Address", "website": "Website", "registration_number": "Registration Number"}',
 ARRAY['name'],
 ARRAY['email', 'phone', 'address', 'website', 'registration_number', 'tax_number'],
 '{"email": {"type": "email"}, "website": {"type": "url"}}',
 '[{"name": "Acme Corporation", "email": "info@acme.com", "phone": "+44 020 7946 0958", "address": "123 Business Street, London, EC1A 1BB", "website": "https://acme.com", "registration_number": "12345678"}]'),

('leave_requests', 'Leave Requests', 'Import leave request data for employees',
 '{"employee_email": "Employee Email", "leave_type": "Leave Type", "start_date": "Start Date", "end_date": "End Date", "days_requested": "Days Requested", "reason": "Reason"}',
 ARRAY['employee_email', 'leave_type', 'start_date', 'end_date', 'days_requested'],
 ARRAY['reason'],
 '{"employee_email": {"type": "email"}, "start_date": {"type": "date", "format": "YYYY-MM-DD"}, "end_date": {"type": "date", "format": "YYYY-MM-DD"}, "days_requested": {"type": "number", "min": 0.5}, "leave_type": {"type": "enum", "values": ["annual", "sick", "personal", "maternity", "paternity"]}}',
 '[{"employee_email": "john.doe@company.com", "leave_type": "annual", "start_date": "2024-03-15", "end_date": "2024-03-22", "days_requested": "5", "reason": "Spring vacation"}]');

-- Function to clean up expired previews
CREATE OR REPLACE FUNCTION public.cleanup_expired_import_previews()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.import_previews WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Trigger to update updated_at columns
CREATE TRIGGER update_import_templates_updated_at
  BEFORE UPDATE ON public.import_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();