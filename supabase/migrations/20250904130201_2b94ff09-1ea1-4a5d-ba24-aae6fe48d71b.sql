-- Add new document categories for immigration
ALTER TYPE document_category ADD VALUE 'cos' AFTER 'contract';
ALTER TYPE document_category ADD VALUE 'rtw' AFTER 'cos';
ALTER TYPE document_category ADD VALUE 'sponsor_licence' AFTER 'rtw';
ALTER TYPE document_category ADD VALUE 'immigration_medical' AFTER 'sponsor_licence';

-- Create employee job history table
CREATE TABLE public.employee_job_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  department TEXT,
  salary NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  reason_for_change TEXT,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emergency contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee education table
CREATE TABLE public.employee_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  institution_name TEXT NOT NULL,
  degree_type TEXT,
  field_of_study TEXT,
  start_date DATE,
  graduation_date DATE,
  is_completed BOOLEAN DEFAULT false,
  grade_gpa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create immigration documents table for specialized tracking
CREATE TABLE public.immigration_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  reference_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  sponsor_licence_number TEXT,
  conditions TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced employees table with additional immigration fields
ALTER TABLE public.employees 
ADD COLUMN sponsorship_status TEXT,
ADD COLUMN sponsor_licence_number TEXT,
ADD COLUMN cos_reference_number TEXT,
ADD COLUMN cos_issue_date DATE,
ADD COLUMN cos_expiry_date DATE,
ADD COLUMN rtw_check_date DATE,
ADD COLUMN rtw_checked_by UUID,
ADD COLUMN immigration_status TEXT DEFAULT 'pending_review',
ADD COLUMN compliance_score INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.employee_job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immigration_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_job_history
CREATE POLICY "Admins and HR can manage job history" 
ON public.employee_job_history 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own job history" 
ON public.employee_job_history 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Managers can view team job history" 
ON public.employee_job_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_job_history.employee_id 
    AND e.manager_id = get_employee_id(auth.uid())
  ) OR is_admin_or_hr(auth.uid())
);

-- RLS Policies for emergency_contacts
CREATE POLICY "Admins and HR can manage emergency contacts" 
ON public.emergency_contacts 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can manage own emergency contacts" 
ON public.emergency_contacts 
FOR ALL 
USING (employee_id = get_employee_id(auth.uid()));

-- RLS Policies for employee_education
CREATE POLICY "Admins and HR can manage education records" 
ON public.employee_education 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can manage own education records" 
ON public.employee_education 
FOR ALL 
USING (employee_id = get_employee_id(auth.uid()));

-- RLS Policies for immigration_documents
CREATE POLICY "Admins and HR can manage immigration documents" 
ON public.immigration_documents 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own immigration documents" 
ON public.immigration_documents 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_employee_job_history_updated_at
BEFORE UPDATE ON public.employee_job_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_education_updated_at
BEFORE UPDATE ON public.employee_education
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_immigration_documents_updated_at
BEFORE UPDATE ON public.immigration_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for checking field-level permissions
CREATE OR REPLACE FUNCTION public.can_view_sensitive_field(user_uuid uuid, field_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN field_type IN ('salary', 'bank_details') THEN is_admin_or_hr(user_uuid)
    WHEN field_type = 'immigration' THEN is_admin_or_hr(user_uuid) 
    ELSE true
  END;
$$;

-- Create function to get employee compliance score
CREATE OR REPLACE FUNCTION public.calculate_compliance_score(employee_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 0;
  emp_record record;
BEGIN
  SELECT * INTO emp_record FROM public.employees WHERE id = employee_uuid;
  
  -- Basic information completeness (30 points)
  IF emp_record.first_name IS NOT NULL THEN score := score + 5; END IF;
  IF emp_record.last_name IS NOT NULL THEN score := score + 5; END IF;
  IF emp_record.email IS NOT NULL THEN score := score + 5; END IF;
  IF emp_record.phone IS NOT NULL THEN score := score + 5; END IF;
  IF emp_record.address IS NOT NULL THEN score := score + 5; END IF;
  IF emp_record.date_of_birth IS NOT NULL THEN score := score + 5; END IF;
  
  -- Immigration documentation (40 points)
  IF emp_record.passport_number IS NOT NULL THEN score := score + 10; END IF;
  IF emp_record.passport_expiry_date IS NOT NULL AND emp_record.passport_expiry_date > CURRENT_DATE THEN score := score + 10; END IF;
  IF emp_record.visa_type IS NOT NULL THEN score := score + 10; END IF;
  IF emp_record.right_to_work_expiry_date IS NOT NULL AND emp_record.right_to_work_expiry_date > CURRENT_DATE THEN score := score + 10; END IF;
  
  -- Emergency contacts (15 points)
  IF EXISTS (SELECT 1 FROM public.emergency_contacts WHERE employee_id = employee_uuid) THEN score := score + 15; END IF;
  
  -- Bank details (15 points)
  IF emp_record.bank_name IS NOT NULL AND emp_record.bank_account_number IS NOT NULL THEN score := score + 15; END IF;
  
  RETURN score;
END;
$$;