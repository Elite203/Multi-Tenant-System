-- Create pro-rata leave calculation function
CREATE OR REPLACE FUNCTION public.calculate_prorata_leave_entitlement(
  hire_date DATE,
  fiscal_year_start DATE DEFAULT '2024-04-01',
  default_allocation NUMERIC DEFAULT 25
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fiscal_year_end DATE;
  total_days INTEGER;
  remaining_days INTEGER;
  prorata_entitlement NUMERIC;
BEGIN
  -- Calculate fiscal year end (one day before next year's start)
  fiscal_year_end := fiscal_year_start + INTERVAL '1 year' - INTERVAL '1 day';
  
  -- If hired before fiscal year starts, give full allocation
  IF hire_date <= fiscal_year_start THEN
    RETURN default_allocation;
  END IF;
  
  -- If hired after fiscal year ends, no allocation for this year
  IF hire_date > fiscal_year_end THEN
    RETURN 0;
  END IF;
  
  -- Calculate pro-rata allocation
  total_days := fiscal_year_end - fiscal_year_start + 1;
  remaining_days := fiscal_year_end - hire_date + 1;
  
  prorata_entitlement := (default_allocation * remaining_days::NUMERIC) / total_days::NUMERIC;
  
  -- Round to 2 decimal places
  RETURN ROUND(prorata_entitlement, 2);
END;
$$;

-- Function to update employee leave entitlements
CREATE OR REPLACE FUNCTION public.update_employee_leave_entitlement(employee_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  emp_record RECORD;
  fiscal_year_start DATE;
  allocation_record RECORD;
  calculated_entitlement NUMERIC;
BEGIN
  -- Get employee data
  SELECT * INTO emp_record FROM public.employees WHERE id = employee_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get fiscal year start from branding settings
  SELECT fiscal_year_start_date INTO fiscal_year_start 
  FROM public.branding_settings 
  LIMIT 1;
  
  IF fiscal_year_start IS NULL THEN
    fiscal_year_start := '2024-04-01';
  END IF;
  
  -- Calculate total entitlement for current fiscal year
  calculated_entitlement := 0;
  
  FOR allocation_record IN 
    SELECT * FROM public.leave_allocations WHERE is_active = true
  LOOP
    calculated_entitlement := calculated_entitlement + 
      calculate_prorata_leave_entitlement(
        emp_record.hire_date,
        fiscal_year_start,
        allocation_record.default_allocation
      );
  END LOOP;
  
  -- Update employee record
  UPDATE public.employees 
  SET 
    leave_entitlement = calculated_entitlement,
    remaining_leaves = calculated_entitlement,
    updated_at = now()
  WHERE id = employee_uuid;
  
  -- Update leave balances
  FOR allocation_record IN 
    SELECT * FROM public.leave_allocations WHERE is_active = true
  LOOP
    INSERT INTO public.leave_balances (
      employee_id,
      leave_type,
      year,
      allocated_days,
      used_days,
      carried_over_days
    )
    VALUES (
      employee_uuid,
      allocation_record.leave_type,
      EXTRACT(year FROM fiscal_year_start)::INTEGER,
      calculate_prorata_leave_entitlement(
        emp_record.hire_date,
        fiscal_year_start,
        allocation_record.default_allocation
      ),
      0,
      0
    )
    ON CONFLICT (employee_id, leave_type, year) 
    DO UPDATE SET
      allocated_days = calculate_prorata_leave_entitlement(
        emp_record.hire_date,
        fiscal_year_start,
        allocation_record.default_allocation
      ),
      updated_at = now();
  END LOOP;
END;
$$;

-- Function to recalculate all employee leave entitlements
CREATE OR REPLACE FUNCTION public.recalculate_all_leave_entitlements()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  employee_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR employee_record IN 
    SELECT id FROM public.employees WHERE status = 'active'
  LOOP
    PERFORM update_employee_leave_entitlement(employee_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Trigger function for automatic leave calculation
CREATE OR REPLACE FUNCTION public.trigger_update_leave_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For INSERT and UPDATE operations
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Only recalculate if hire_date changed or it's a new employee
    IF TG_OP = 'INSERT' OR (OLD.hire_date IS DISTINCT FROM NEW.hire_date) THEN
      PERFORM update_employee_leave_entitlement(NEW.id);
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_employee_leave_calculation ON public.employees;
CREATE TRIGGER trigger_employee_leave_calculation
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_leave_entitlement();

-- Trigger for leave allocation changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_all_leaves()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate all employee leaves when allocations change
  PERFORM recalculate_all_leave_entitlements();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_leave_allocation_changes ON public.leave_allocations;
CREATE TRIGGER trigger_leave_allocation_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.leave_allocations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_recalculate_all_leaves();

-- Trigger for fiscal year changes
DROP TRIGGER IF EXISTS trigger_fiscal_year_changes ON public.branding_settings;
CREATE TRIGGER trigger_fiscal_year_changes
  AFTER UPDATE ON public.branding_settings
  FOR EACH ROW
  WHEN (OLD.fiscal_year_start_date IS DISTINCT FROM NEW.fiscal_year_start_date)
  EXECUTE FUNCTION public.trigger_recalculate_all_leaves();

-- Update employee import template to remove leave fields
UPDATE public.import_templates 
SET 
  required_fields = array_remove(array_remove(required_fields, 'leave_entitlement'), 'remaining_leaves'),
  optional_fields = array_remove(array_remove(optional_fields, 'leave_entitlement'), 'remaining_leaves'),
  field_mappings = field_mappings - 'leave_entitlement' - 'remaining_leaves',
  validation_rules = validation_rules - 'leave_entitlement' - 'remaining_leaves',
  description = 'Import employee data with automatic pro-rata leave calculation based on hire date and fiscal year settings.',
  sample_data = sample_data - 'leave_entitlement' - 'remaining_leaves'
WHERE module_name = 'employees';

-- Recalculate existing employee leave entitlements
SELECT recalculate_all_leave_entitlements();