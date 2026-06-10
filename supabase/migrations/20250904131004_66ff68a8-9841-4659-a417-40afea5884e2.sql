-- Migrate existing data from employees table to new specialized tables

-- Migrate passport data
INSERT INTO public.employee_passports (employee_id, passport_number, expiry_date, issuing_country, created_at, updated_at)
SELECT id, passport_number, passport_expiry_date, 'Unknown', created_at, updated_at
FROM public.employees
WHERE passport_number IS NOT NULL;

-- Migrate visa data  
INSERT INTO public.employee_visas (employee_id, visa_type, expiry_date, issuing_country, created_at, updated_at)
SELECT id, visa_type, visa_expiry_date, 'Unknown', created_at, updated_at
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