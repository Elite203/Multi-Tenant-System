-- Phase 2: Database Security Hardening - Fixed version without CONCURRENTLY

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
CREATE INDEX IF NOT EXISTS idx_employees_status_company 
  ON public.employees (status, company_id) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_department_active 
  ON public.employees (department) WHERE status = 'active' AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_manager_active 
  ON public.employees (manager_id) WHERE status = 'active' AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_immigration_status 
  ON public.employees (immigration_status) WHERE archived_at IS NULL;

-- Add validation constraints
ALTER TABLE public.employees 
  ADD CONSTRAINT IF NOT EXISTS check_hire_date_not_future 
  CHECK (hire_date <= CURRENT_DATE);

ALTER TABLE public.employees 
  ADD CONSTRAINT IF NOT EXISTS check_start_date_after_hire 
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