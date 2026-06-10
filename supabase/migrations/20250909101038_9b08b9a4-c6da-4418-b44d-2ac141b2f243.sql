-- Fix the enum casting issue in update_employee_leave_entitlement function
CREATE OR REPLACE FUNCTION public.update_employee_leave_entitlement(employee_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp_record RECORD;
  fiscal_year_start DATE;
  allocation_record RECORD;
  calculated_entitlement NUMERIC;
  target_leave_type leave_type; -- Use the correct enum type for leave_balances
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
  
  -- Update leave balances with proper string-based enum conversion
  FOR allocation_record IN 
    SELECT * FROM public.leave_allocations WHERE is_active = true
  LOOP
    -- Convert enum value safely by casting to text first, then to the target enum
    CASE allocation_record.leave_type::text
      WHEN 'annual' THEN target_leave_type := 'annual'::leave_type;
      WHEN 'sick' THEN target_leave_type := 'sick'::leave_type;
      WHEN 'personal' THEN target_leave_type := 'personal'::leave_type;
      WHEN 'maternity' THEN target_leave_type := 'maternity'::leave_type;
      WHEN 'paternity' THEN target_leave_type := 'paternity'::leave_type;
      WHEN 'bereavement' THEN target_leave_type := 'bereavement'::leave_type;
      ELSE 
        -- Skip unknown leave types
        CONTINUE;
    END CASE;
    
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
      target_leave_type,
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
$function$;