-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'hr', 'manager', 'employee', 'director');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated', 'archived');
CREATE TYPE public.employee_type AS ENUM ('staff', 'manager', 'director', 'owner', 'executive');
CREATE TYPE public.leave_type AS ENUM ('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.document_category AS ENUM ('personal', 'certificate', 'employment', 'financial', 'compliance');

-- System settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default company limits
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('max_parent_companies', '1', 'Maximum number of parent companies allowed'),
('max_child_companies', '10', 'Maximum number of child companies allowed per parent'),
('session_timeout_minutes', '60', 'Session timeout in minutes'),
('fiscal_year_start', '"2024-04-01"', 'Fiscal year start date');

-- Companies table with parent/child hierarchy
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_code TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_number TEXT,
  registration_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'employee',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  force_password_change BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  hire_date DATE NOT NULL,
  job_title TEXT,
  department TEXT,
  employee_type employee_type DEFAULT 'staff',
  status employee_status DEFAULT 'active',
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  salary DECIMAL(12,2),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_sort_code TEXT,
  national_insurance_number TEXT,
  passport_number TEXT,
  passport_expiry_date DATE,
  visa_type TEXT,
  visa_expiry_date DATE,
  right_to_work_expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leave balances table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  allocated_days DECIMAL(4,1) DEFAULT 0,
  used_days DECIMAL(4,1) DEFAULT 0,
  carried_over_days DECIMAL(4,1) DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(4,1) NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  expiry_date DATE,
  uploaded_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit log table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for system_settings
CREATE POLICY "Admins and HR can view system settings" ON public.system_settings
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can modify system settings" ON public.system_settings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for companies
CREATE POLICY "Everyone can view companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Admins and HR can modify companies" ON public.companies
  FOR ALL USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and HR can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for employees
CREATE POLICY "Users can view own employee record" ON public.employees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all employees" ON public.employees
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Managers can view their team" ON public.employees
  FOR SELECT USING (
    manager_id = public.get_employee_id(auth.uid()) OR
    public.is_admin_or_hr(auth.uid())
  );

CREATE POLICY "Admins and HR can modify employees" ON public.employees
  FOR ALL USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for leave_balances
CREATE POLICY "Users can view own leave balances" ON public.leave_balances
  FOR SELECT USING (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can view all leave balances" ON public.leave_balances
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can modify leave balances" ON public.leave_balances
  FOR ALL USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view own leave requests" ON public.leave_requests
  FOR SELECT USING (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can view all leave requests" ON public.leave_requests
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can create own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Users can update own pending leave requests" ON public.leave_requests
  FOR UPDATE USING (
    employee_id = public.get_employee_id(auth.uid()) AND status = 'pending'
  );

CREATE POLICY "Admins and HR can manage all leave requests" ON public.leave_requests
  FOR ALL USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can view all documents" ON public.documents
  FOR SELECT USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can upload own documents" ON public.documents
  FOR INSERT WITH CHECK (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can manage all documents" ON public.documents
  FOR ALL USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get default company for new employees
CREATE OR REPLACE FUNCTION public.get_default_company()
RETURNS UUID AS $$
  SELECT id FROM public.companies WHERE parent_company_id IS NULL AND is_active = true LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to validate company hierarchy limits
CREATE OR REPLACE FUNCTION public.validate_company_limits()
RETURNS TRIGGER AS $$
DECLARE
  parent_count INTEGER;
  child_count INTEGER;
  max_parents INTEGER;
  max_children INTEGER;
BEGIN
  -- Get limits from settings
  SELECT (setting_value->>'value')::INTEGER INTO max_parents 
  FROM public.system_settings WHERE setting_key = 'max_parent_companies';
  
  SELECT (setting_value->>'value')::INTEGER INTO max_children
  FROM public.system_settings WHERE setting_key = 'max_child_companies';

  -- Check parent company limits
  IF NEW.parent_company_id IS NULL THEN
    SELECT COUNT(*) INTO parent_count 
    FROM public.companies WHERE parent_company_id IS NULL AND is_active = true;
    
    IF parent_count >= max_parents THEN
      RAISE EXCEPTION 'Maximum number of parent companies (%) exceeded', max_parents;
    END IF;
  ELSE
    -- Check child company limits
    SELECT COUNT(*) INTO child_count
    FROM public.companies WHERE parent_company_id = NEW.parent_company_id AND is_active = true;
    
    IF child_count >= max_children THEN
      RAISE EXCEPTION 'Maximum number of child companies (%) exceeded for parent company', max_children;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add company validation trigger
CREATE TRIGGER validate_company_limits_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_limits();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.companies (name, company_code, address, email, is_active) VALUES
('TechCorp Solutions Ltd', 'TECH001', '123 Business Street, London, SW1A 1AA', 'info@techcorp.com', true);

-- Get the company ID for sample employee
DO $$
DECLARE
  default_company_id UUID;
BEGIN
  SELECT id INTO default_company_id FROM public.companies WHERE company_code = 'TECH001';
  
  INSERT INTO public.employees (company_id, employee_number, first_name, last_name, email, hire_date, job_title, department) VALUES
  (default_company_id, 'EMP001', 'John', 'Admin', 'admin@techcorp.com', CURRENT_DATE, 'System Administrator', 'IT');
END $$;