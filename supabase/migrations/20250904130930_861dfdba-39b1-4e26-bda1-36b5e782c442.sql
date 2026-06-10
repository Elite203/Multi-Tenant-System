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
  document_type TEXT NOT NULL,
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
  training_type TEXT,
  completion_date DATE,
  expiry_date DATE,
  score NUMERIC,
  status TEXT DEFAULT 'not_started',
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
CREATE POLICY "Admins and HR can manage passport records" ON public.employee_passports FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own passport records" ON public.employee_passports FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own passport records" ON public.employee_passports FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own passport records" ON public.employee_passports FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_visas
CREATE POLICY "Admins and HR can manage visa records" ON public.employee_visas FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own visa records" ON public.employee_visas FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own visa records" ON public.employee_visas FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own visa records" ON public.employee_visas FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_rtw_documents
CREATE POLICY "Admins and HR can manage RTW documents" ON public.employee_rtw_documents FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own RTW documents" ON public.employee_rtw_documents FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_cos_documents
CREATE POLICY "Admins and HR can manage COS documents" ON public.employee_cos_documents FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own COS documents" ON public.employee_cos_documents FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_bank_details (sensitive data)
CREATE POLICY "Admins and HR can manage bank details" ON public.employee_bank_details FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own bank details" ON public.employee_bank_details FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own bank details" ON public.employee_bank_details FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own bank details" ON public.employee_bank_details FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_certifications
CREATE POLICY "Admins and HR can manage certifications" ON public.employee_certifications FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own certifications" ON public.employee_certifications FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own certifications" ON public.employee_certifications FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own certifications" ON public.employee_certifications FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_training
CREATE POLICY "Admins and HR can manage training records" ON public.employee_training FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own training records" ON public.employee_training FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own training records" ON public.employee_training FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own training records" ON public.employee_training FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for employee_work_profiles
CREATE POLICY "Admins and HR can manage work profiles" ON public.employee_work_profiles FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own work profile" ON public.employee_work_profiles FOR SELECT USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can insert own work profile" ON public.employee_work_profiles FOR INSERT WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "Users can update own work profile" ON public.employee_work_profiles FOR UPDATE USING (employee_id = get_employee_id(auth.uid()));

-- Add triggers for updated_at columns
CREATE TRIGGER update_employee_passports_updated_at BEFORE UPDATE ON public.employee_passports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_visas_updated_at BEFORE UPDATE ON public.employee_visas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_rtw_documents_updated_at BEFORE UPDATE ON public.employee_rtw_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_cos_documents_updated_at BEFORE UPDATE ON public.employee_cos_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_bank_details_updated_at BEFORE UPDATE ON public.employee_bank_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_certifications_updated_at BEFORE UPDATE ON public.employee_certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_training_updated_at BEFORE UPDATE ON public.employee_training FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_work_profiles_updated_at BEFORE UPDATE ON public.employee_work_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();