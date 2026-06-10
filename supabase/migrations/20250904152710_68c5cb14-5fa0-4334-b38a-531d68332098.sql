-- Create normalized metadata tables
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  parent_department_id UUID REFERENCES public.departments(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(title, department_id)
);

CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  currency_code TEXT,
  is_eu BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.visa_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_id UUID REFERENCES public.countries(id),
  description TEXT,
  requirements JSONB,
  duration_months INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, country_id)
);

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage departments" ON public.departments FOR ALL USING (is_admin_or_hr(auth.uid()));

-- RLS policies for job_titles
CREATE POLICY "Everyone can view job titles" ON public.job_titles FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage job titles" ON public.job_titles FOR ALL USING (is_admin_or_hr(auth.uid()));

-- RLS policies for countries
CREATE POLICY "Everyone can view countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage countries" ON public.countries FOR ALL USING (is_admin_or_hr(auth.uid()));

-- RLS policies for visa_types
CREATE POLICY "Everyone can view visa types" ON public.visa_types FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage visa types" ON public.visa_types FOR ALL USING (is_admin_or_hr(auth.uid()));

-- Insert default data
INSERT INTO public.countries (name, code, currency_code, is_eu) VALUES
('United Kingdom', 'GB', 'GBP', false),
('United States', 'US', 'USD', false),
('Germany', 'DE', 'EUR', true),
('France', 'FR', 'EUR', true),
('Spain', 'ES', 'EUR', true),
('Italy', 'IT', 'EUR', true),
('Netherlands', 'NL', 'EUR', true),
('Canada', 'CA', 'CAD', false),
('Australia', 'AU', 'AUD', false),
('Ireland', 'IE', 'EUR', true);

INSERT INTO public.departments (name, code, description) VALUES
('Human Resources', 'HR', 'Employee relations and administration'),
('Engineering', 'ENG', 'Software development and technical operations'),
('Sales', 'SALES', 'Business development and customer acquisition'),
('Marketing', 'MKT', 'Brand promotion and market research'),
('Finance', 'FIN', 'Financial planning and accounting'),
('Operations', 'OPS', 'Daily business operations and logistics'),
('Customer Success', 'CS', 'Customer support and success management'),
('Legal', 'LEGAL', 'Legal compliance and contract management');

-- Insert job titles for each department
INSERT INTO public.job_titles (title, department_id, level) 
SELECT 'HR Manager', id, 'Manager' FROM public.departments WHERE code = 'HR'
UNION ALL
SELECT 'HR Specialist', id, 'Senior' FROM public.departments WHERE code = 'HR'
UNION ALL
SELECT 'Recruiter', id, 'Mid' FROM public.departments WHERE code = 'HR'
UNION ALL
SELECT 'Software Engineer', id, 'Senior' FROM public.departments WHERE code = 'ENG'
UNION ALL
SELECT 'Senior Software Engineer', id, 'Senior' FROM public.departments WHERE code = 'ENG'
UNION ALL
SELECT 'Engineering Manager', id, 'Manager' FROM public.departments WHERE code = 'ENG'
UNION ALL
SELECT 'DevOps Engineer', id, 'Senior' FROM public.departments WHERE code = 'ENG'
UNION ALL
SELECT 'Sales Manager', id, 'Manager' FROM public.departments WHERE code = 'SALES'
UNION ALL
SELECT 'Account Executive', id, 'Senior' FROM public.departments WHERE code = 'SALES'
UNION ALL
SELECT 'Sales Representative', id, 'Mid' FROM public.departments WHERE code = 'SALES'
UNION ALL
SELECT 'Marketing Manager', id, 'Manager' FROM public.departments WHERE code = 'MKT'
UNION ALL
SELECT 'Marketing Specialist', id, 'Mid' FROM public.departments WHERE code = 'MKT'
UNION ALL
SELECT 'Finance Manager', id, 'Manager' FROM public.departments WHERE code = 'FIN'
UNION ALL
SELECT 'Accountant', id, 'Mid' FROM public.departments WHERE code = 'FIN'
UNION ALL
SELECT 'Operations Manager', id, 'Manager' FROM public.departments WHERE code = 'OPS'
UNION ALL
SELECT 'Customer Success Manager', id, 'Manager' FROM public.departments WHERE code = 'CS'
UNION ALL
SELECT 'Support Specialist', id, 'Mid' FROM public.departments WHERE code = 'CS'
UNION ALL
SELECT 'Legal Counsel', id, 'Senior' FROM public.departments WHERE code = 'LEGAL';

-- Insert common visa types
INSERT INTO public.visa_types (name, country_id, description, duration_months)
SELECT 'Skilled Worker Visa', id, 'For skilled workers with job offers in the UK', 60 FROM public.countries WHERE code = 'GB'
UNION ALL
SELECT 'Global Talent Visa', id, 'For exceptional talent in specific fields', 60 FROM public.countries WHERE code = 'GB'
UNION ALL
SELECT 'Student Visa', id, 'For students studying in the UK', 48 FROM public.countries WHERE code = 'GB'
UNION ALL
SELECT 'H-1B', id, 'Specialty occupation work visa', 36 FROM public.countries WHERE code = 'US'
UNION ALL
SELECT 'L-1', id, 'Intracompany transfer visa', 60 FROM public.countries WHERE code = 'US'
UNION ALL
SELECT 'O-1', id, 'Extraordinary ability visa', 36 FROM public.countries WHERE code = 'US'
UNION ALL
SELECT 'EU Blue Card', id, 'Highly skilled worker permit', 48 FROM public.countries WHERE code = 'DE'
UNION ALL
SELECT 'Work Permit', id, 'General work authorization', 24 FROM public.countries WHERE code = 'DE';

-- Add triggers for updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_titles_updated_at
  BEFORE UPDATE ON public.job_titles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visa_types_updated_at
  BEFORE UPDATE ON public.visa_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Clean up old system settings
DELETE FROM public.system_settings WHERE setting_key IN (
  'departments', 'job_titles', 'supported_countries', 'visa_types',
  'default_country', 'default_currency', 'holiday_calendar_country'
);