-- Fix remaining security definer functions with proper search paths
CREATE OR REPLACE FUNCTION public.can_view_sensitive_field(user_uuid uuid, field_type text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN field_type IN ('salary', 'bank_details') THEN is_admin_or_hr(user_uuid)
    WHEN field_type = 'immigration' THEN is_admin_or_hr(user_uuid) 
    ELSE true
  END;
$function$;

CREATE OR REPLACE FUNCTION public.can_hard_delete(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$function$;

-- Fix the security definer view by dropping and recreating as a regular view
DROP VIEW IF EXISTS public.employee_complete_view CASCADE;

-- Create a secure function to get employee complete data instead of a security definer view
CREATE OR REPLACE FUNCTION public.get_employee_complete_secure(employee_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  current_user_id uuid := auth.uid();
  user_role text;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.profiles WHERE id = current_user_id;
  
  -- Check if user can access this employee data
  IF NOT (
    user_role IN ('admin', 'hr') OR 
    EXISTS (SELECT 1 FROM public.employees WHERE id = employee_uuid AND user_id = current_user_id) OR
    EXISTS (SELECT 1 FROM public.employees WHERE id = employee_uuid AND manager_id = (SELECT id FROM public.employees WHERE user_id = current_user_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get employee data with joins
  SELECT to_jsonb(emp_data.*) INTO result FROM (
    SELECT 
      e.id,
      e.employee_number,
      e.first_name,
      e.last_name,
      e.email,
      e.phone,
      e.address,
      e.date_of_birth,
      e.national_insurance_number,
      e.profile_photo,
      e.start_date,
      e.hire_date,
      e.status,
      e.employee_type,
      CASE WHEN user_role IN ('admin', 'hr') THEN e.salary ELSE NULL END as salary,
      e.leave_entitlement,
      e.remaining_leaves,
      e.immigration_status,
      e.compliance_score,
      e.company_id,
      e.user_id,
      e.manager_id,
      e.sponsored_by_company_id,
      e.current_nationality_id,
      e.created_at,
      e.updated_at,
      e.archived_at,
      e.archived_by,
      c.name as company_name,
      jt.title as job_title_name,
      d.name as department_name,
      cn.name as current_nationality_name,
      sc.name as sponsored_by_company_name,
      CONCAT(m.first_name, ' ', m.last_name) as manager_name,
      m.first_name as manager_first_name,
      m.last_name as manager_last_name,
      m.employee_number as manager_employee_number
    FROM public.employees e
    LEFT JOIN public.companies c ON e.company_id = c.id
    LEFT JOIN public.job_titles jt ON e.job_title = jt.id
    LEFT JOIN public.departments d ON e.department = d.id
    LEFT JOIN public.countries cn ON e.current_nationality_id = cn.id
    LEFT JOIN public.companies sc ON e.sponsored_by_company_id = sc.id
    LEFT JOIN public.employees m ON e.manager_id = m.id
    WHERE e.id = employee_uuid
  ) emp_data;
  
  RETURN result;
END;
$function$;