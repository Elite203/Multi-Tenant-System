-- Phase 2: Database Security Hardening - Fix SECURITY DEFINER functions with proper search paths

-- Update existing functions to have consistent search_path and security
CREATE OR REPLACE FUNCTION public.calculate_immigration_status(employee_uuid uuid)
 RETURNS immigration_status_enum
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  passport_expired boolean := false;
  passport_expiring_soon boolean := false;
  visa_expired boolean := false;
  visa_expiring_soon boolean := false;
  rtw_expired boolean := false;
  rtw_expiring_soon boolean := false;
  rtw_invalid boolean := false;
  cos_inactive boolean := false;
  has_valid_passport boolean := false;
  has_valid_visa boolean := false;
  has_valid_rtw boolean := false;
  has_active_cos boolean := false;
BEGIN
  -- Check current passport status
  SELECT 
    CASE WHEN expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    true
  INTO passport_expired, passport_expiring_soon, has_valid_passport
  FROM employee_passports 
  WHERE employee_id = employee_uuid AND is_current = true AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check current visa status
  SELECT 
    CASE WHEN expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    true
  INTO visa_expired, visa_expiring_soon, has_valid_visa
  FROM employee_visas 
  WHERE employee_id = employee_uuid AND is_current = true
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check RTW document status
  SELECT 
    CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    CASE WHEN is_valid = false THEN true ELSE false END,
    true
  INTO rtw_expired, rtw_expiring_soon, rtw_invalid, has_valid_rtw
  FROM employee_rtw_documents 
  WHERE employee_id = employee_uuid AND is_current_active = true AND status = 'Active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check COS document status
  SELECT 
    CASE WHEN cos_status IN ('Inactive', 'Expired', 'Archived') THEN true ELSE false END,
    true
  INTO cos_inactive, has_active_cos
  FROM employee_cos_documents 
  WHERE employee_id = employee_uuid AND cos_status = 'Active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Determine status based on priority logic
  -- 1. Expired documents (highest priority)
  IF passport_expired OR visa_expired OR rtw_expired THEN
    RETURN 'expired'::immigration_status_enum;
  END IF;

  -- 2. Invalid/inactive documents
  IF rtw_invalid OR cos_inactive THEN
    RETURN 'rejected'::immigration_status_enum;
  END IF;

  -- 3. Documents expiring soon
  IF passport_expiring_soon OR visa_expiring_soon OR rtw_expiring_soon THEN
    RETURN 'requires_renewal'::immigration_status_enum;
  END IF;

  -- 4. All required documents present and valid
  IF has_valid_passport AND (has_valid_visa OR has_valid_rtw) THEN
    RETURN 'approved'::immigration_status_enum;
  END IF;

  -- 5. Default: pending review (missing or incomplete documents)
  RETURN 'pending_review'::immigration_status_enum;
END;
$function$;

-- Create audit trigger for employee changes
CREATE OR REPLACE FUNCTION public.audit_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    'employees',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit trigger to employees table
DROP TRIGGER IF EXISTS employees_audit_trigger ON public.employees;
CREATE TRIGGER employees_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_employee_changes();

-- Create performance indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status_company 
  ON public.employees (status, company_id) WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_active 
  ON public.employees (department) WHERE status = 'active' AND archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_manager_active 
  ON public.employees (manager_id) WHERE status = 'active' AND archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_immigration_status 
  ON public.employees (immigration_status) WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search_text 
  ON public.employees USING GIN (
    (first_name || ' ' || last_name || ' ' || employee_number || ' ' || COALESCE(email, ''))
  );

-- Add validation constraints
ALTER TABLE public.employees 
  ADD CONSTRAINT check_hire_date_not_future 
  CHECK (hire_date <= CURRENT_DATE);

ALTER TABLE public.employees 
  ADD CONSTRAINT check_start_date_after_hire 
  CHECK (start_date IS NULL OR start_date >= hire_date);

-- Create function to validate employee data integrity
CREATE OR REPLACE FUNCTION public.validate_employee_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate NI number format (basic UK format)
  IF NEW.national_insurance_number IS NOT NULL AND 
     NEW.national_insurance_number !~ '^[A-Z]{2}[0-9]{6}[A-Z]?$' THEN
    RAISE EXCEPTION 'Invalid National Insurance Number format';
  END IF;

  -- Validate email format
  IF NEW.email IS NOT NULL AND 
     NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Ensure manager is not self
  IF NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'Employee cannot be their own manager';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply validation trigger
DROP TRIGGER IF EXISTS employees_validation_trigger ON public.employees;
CREATE TRIGGER employees_validation_trigger
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.validate_employee_data();