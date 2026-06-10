-- Create specialized tables for employee data normalization

-- 1. Employee Passports Table
CREATE TABLE public.employee_passports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  passport_number TEXT NOT NULL,
  issuing_country TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT true,
  document_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Employee Visas Table
CREATE TABLE public.employee_visas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  visa_type TEXT NOT NULL,
  visa_number TEXT,
  issuing_country TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  entry_date DATE,
  conditions TEXT,
  is_current BOOLEAN DEFAULT true,
  document_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Employee RTW Documents Table
CREATE TABLE public.employee_rtw_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'passport', 'birth_certificate', 'driving_licence', etc.
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  checked_date DATE,
  checked_by UUID,
  is_valid BOOLEAN DEFAULT true,
  document_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Employee COS Documents Table
CREATE TABLE public.employee_cos_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  cos_reference_number TEXT NOT NULL,
  sponsor_licence_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  job_title TEXT,
  salary NUMERIC,
  sponsorship_status TEXT DEFAULT 'active',
  document_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Employee Bank Details Table
CREATE TABLE public.employee_bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  sort_code TEXT,
  iban TEXT,
  swift_code TEXT,
  is_primary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Employee Certifications Table
CREATE TABLE public.employee_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  requires_renewal BOOLEAN DEFAULT false,
  document_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Employee Training Table
CREATE TABLE public.employee_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  training_name TEXT NOT NULL,
  training_provider TEXT,
  training_type TEXT, -- 'mandatory', 'professional_development', 'compliance', etc.
  completion_date DATE,
  expiry_date DATE,
  score NUMERIC,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'expired'
  is_mandatory BOOLEAN DEFAULT false,
  document_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Employee Work Profiles Table
CREATE TABLE public.employee_work_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  skills JSONB,
  work_preferences JSONB,
  performance_metrics JSONB,
  career_goals TEXT,
  availability JSONB,
  remote_work_preference TEXT,
  travel_willingness TEXT,
  languages JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.employee_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_rtw_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_cos_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_work_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_passports
CREATE POLICY "Admins and HR can manage passport records" ON public.employee_passports
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own passport records" ON public.employee_passports
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own passport records" ON public.employee_passports
  FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_visas
CREATE POLICY "Admins and HR can manage visa records" ON public.employee_visas
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own visa records" ON public.employee_visas
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own visa records" ON public.employee_visas
  FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_rtw_documents
CREATE POLICY "Admins and HR can manage RTW documents" ON public.employee_rtw_documents
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own RTW documents" ON public.employee_rtw_documents
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_cos_documents
CREATE POLICY "Admins and HR can manage COS documents" ON public.employee_cos_documents
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own COS documents" ON public.employee_cos_documents
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_bank_details (sensitive data)
CREATE POLICY "Admins and HR can manage bank details" ON public.employee_bank_details
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own bank details" ON public.employee_bank_details
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own bank details" ON public.employee_bank_details
  FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_certifications
CREATE POLICY "Admins and HR can manage certifications" ON public.employee_certifications
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own certifications" ON public.employee_certifications
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can manage own certifications" ON public.employee_certifications
  FOR INSERT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own certifications" ON public.employee_certifications
  FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_training
CREATE POLICY "Admins and HR can manage training records" ON public.employee_training
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own training records" ON public.employee_training
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own training records" ON public.employee_training
  FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_work_profiles
CREATE POLICY "Admins and HR can manage work profiles" ON public.employee_work_profiles
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own work profile" ON public.employee_work_profiles
  FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can manage own work profile" ON public.employee_work_profiles
  FOR ALL USING (employee_id = get_employee_id(auth.uid()));

-- Add triggers for updated_at columns
CREATE TRIGGER update_employee_passports_updated_at
  BEFORE UPDATE ON public.employee_passports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_visas_updated_at
  BEFORE UPDATE ON public.employee_visas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_rtw_documents_updated_at
  BEFORE UPDATE ON public.employee_rtw_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_cos_documents_updated_at
  BEFORE UPDATE ON public.employee_cos_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_bank_details_updated_at
  BEFORE UPDATE ON public.employee_bank_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_certifications_updated_at
  BEFORE UPDATE ON public.employee_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_training_updated_at
  BEFORE UPDATE ON public.employee_training
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_work_profiles_updated_at
  BEFORE UPDATE ON public.employee_work_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from employees table to new specialized tables

-- Migrate passport data
INSERT INTO public.employee_passports (employee_id, passport_number, expiry_date, created_at, updated_at)
SELECT id, passport_number, passport_expiry_date, created_at, updated_at
FROM public.employees
WHERE passport_number IS NOT NULL;

-- Migrate visa data
INSERT INTO public.employee_visas (employee_id, visa_type, expiry_date, created_at, updated_at)
SELECT id, visa_type, visa_expiry_date, created_at, updated_at
FROM public.employees
WHERE visa_type IS NOT NULL;

-- Migrate RTW data
INSERT INTO public.employee_rtw_documents (employee_id, document_type, expiry_date, checked_date, checked_by, created_at, updated_at)
SELECT id, 'right_to_work', right_to_work_expiry_date, rtw_check_date, rtw_checked_by, created_at, updated_at
FROM public.employees
WHERE right_to_work_expiry_date IS NOT NULL;

-- Migrate COS data
INSERT INTO public.employee_cos_documents (employee_id, cos_reference_number, sponsor_licence_number, issue_date, expiry_date, created_at, updated_at)
SELECT id, cos_reference_number, sponsor_licence_number, cos_issue_date, cos_expiry_date, created_at, updated_at
FROM public.employees
WHERE cos_reference_number IS NOT NULL;

-- Migrate bank details
INSERT INTO public.employee_bank_details (employee_id, bank_name, account_holder_name, account_number, sort_code, created_at, updated_at)
SELECT id, bank_name, CONCAT(first_name, ' ', last_name), bank_account_number, bank_sort_code, created_at, updated_at
FROM public.employees
WHERE bank_name IS NOT NULL AND bank_account_number IS NOT NULL;

-- Remove redundant columns from employees table
ALTER TABLE public.employees 
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_relationship,
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS bank_account_number,
DROP COLUMN IF EXISTS bank_sort_code,
DROP COLUMN IF EXISTS passport_number,
DROP COLUMN IF EXISTS passport_expiry_date,
DROP COLUMN IF EXISTS visa_type,
DROP COLUMN IF EXISTS visa_expiry_date,
DROP COLUMN IF EXISTS right_to_work_expiry_date,
DROP COLUMN IF EXISTS cos_reference_number,
DROP COLUMN IF EXISTS cos_issue_date,
DROP COLUMN IF EXISTS cos_expiry_date,
DROP COLUMN IF EXISTS rtw_check_date,
DROP COLUMN IF EXISTS rtw_checked_by,
DROP COLUMN IF EXISTS sponsor_licence_number,
DROP COLUMN IF EXISTS sponsorship_status;

-- Update the compliance score function to use new normalized tables
CREATE OR REPLACE FUNCTION public.calculate_compliance_score(employee_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  score integer := 0;
  emp_record record;
BEGIN
  SELECT * INTO emp_record FROM public.employees WHERE id = employee_uuid;
  
  -- Basic information completeness (20 points)
  IF emp_record.first_name IS NOT NULL THEN score := score + 3; END IF;
  IF emp_record.last_name IS NOT NULL THEN score := score + 3; END IF;
  IF emp_record.email IS NOT NULL THEN score := score + 3; END IF;
  IF emp_record.phone IS NOT NULL THEN score := score + 3; END IF;
  IF emp_record.address IS NOT NULL THEN score := score + 3; END IF;
  IF emp_record.date_of_birth IS NOT NULL THEN score := score + 5; END IF;
  
  -- Passport documentation (20 points)
  IF EXISTS (SELECT 1 FROM public.employee_passports WHERE employee_id = employee_uuid AND is_current = true) THEN 
    score := score + 10; 
  END IF;
  IF EXISTS (SELECT 1 FROM public.employee_passports WHERE employee_id = employee_uuid AND is_current = true AND expiry_date > CURRENT_DATE) THEN 
    score := score + 10; 
  END IF;
  
  -- Visa documentation (20 points)
  IF EXISTS (SELECT 1 FROM public.employee_visas WHERE employee_id = employee_uuid AND is_current = true) THEN 
    score := score + 10; 
  END IF;
  IF EXISTS (SELECT 1 FROM public.employee_visas WHERE employee_id = employee_uuid AND is_current = true AND expiry_date > CURRENT_DATE) THEN 
    score := score + 10; 
  END IF;
  
  -- RTW documentation (20 points)
  IF EXISTS (SELECT 1 FROM public.employee_rtw_documents WHERE employee_id = employee_uuid AND is_valid = true) THEN 
    score := score + 10; 
  END IF;
  IF EXISTS (SELECT 1 FROM public.employee_rtw_documents WHERE employee_id = employee_uuid AND is_valid = true AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)) THEN 
    score := score + 10; 
  END IF;
  
  -- Emergency contacts (10 points)
  IF EXISTS (SELECT 1 FROM public.emergency_contacts WHERE employee_id = employee_uuid) THEN 
    score := score + 10; 
  END IF;
  
  -- Bank details (10 points)
  IF EXISTS (SELECT 1 FROM public.employee_bank_details WHERE employee_id = employee_uuid AND is_active = true) THEN 
    score := score + 10; 
  END IF;
  
  RETURN score;
END;
$function$;