-- Fix security issues from linter

-- 1. Fix function search path for security functions
CREATE OR REPLACE FUNCTION public.is_admin_or_hr(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_only(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$$;

-- 2. Create a proper secure view instead of security definer view
DROP VIEW IF EXISTS public.employee_complete_view;

CREATE VIEW public.employee_complete_view
WITH (security_invoker=true) AS
SELECT 
  e.id,
  e.user_id,
  e.company_id,
  e.employee_number,
  e.first_name,
  e.last_name,
  e.email,
  e.phone,
  e.date_of_birth,
  e.address,
  e.hire_date,
  e.start_date,
  e.employee_type,
  e.status,
  e.manager_id,
  e.salary,
  e.leave_entitlement,
  e.remaining_leaves,
  e.weekly_working_hours,
  e.sponsored_by_company_id,
  e.current_nationality_id,
  e.job_title,
  e.department,
  e.profile_photo,
  e.immigration_status,
  e.compliance_score,
  e.national_insurance_number,
  e.created_at,
  e.updated_at,
  e.archived_at,
  e.archived_by,
  -- Computed fields with proper joins
  c.name as company_name,
  jt.title as job_title_name,
  d.name as department_name,
  cn.name as current_nationality_name,
  sc.name as sponsored_by_company_name,
  m.first_name as manager_first_name,
  m.last_name as manager_last_name,
  m.employee_number as manager_employee_number,
  -- Work profile fields
  ewp.skills,
  ewp.languages,
  ewp.work_preferences,
  ewp.availability,
  ewp.performance_metrics,
  ewp.career_goals,
  ewp.remote_work_preference,
  ewp.travel_willingness,
  ewp.soc_number,
  ewp.work_email,
  ewp.work_phone,
  ewp.work_location
FROM employees e
LEFT JOIN companies c ON e.company_id = c.id
LEFT JOIN job_titles jt ON e.job_title = jt.id
LEFT JOIN departments d ON e.department = d.id
LEFT JOIN countries cn ON e.current_nationality_id = cn.id
LEFT JOIN companies sc ON e.sponsored_by_company_id = sc.id
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_work_profiles ewp ON e.id = ewp.employee_id;

-- 3. Update the complete employee function to use security invoker
CREATE OR REPLACE FUNCTION public.get_employee_complete(employee_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user can view this employee
  IF NOT (
    is_admin_or_hr(auth.uid()) OR 
    get_employee_id(auth.uid()) = employee_uuid OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE manager_id = get_employee_id(auth.uid()) 
      AND id = employee_uuid
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get employee data from the view
  SELECT to_jsonb(ecv.*) INTO result 
  FROM employee_complete_view ecv 
  WHERE ecv.id = employee_uuid;
  
  IF result IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Add aggregated related data (only for authorized users)
  result := result || jsonb_build_object(
    'direct_reports_count', (
      SELECT COUNT(*) FROM employees WHERE manager_id = employee_uuid
    ),
    'passports', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ep.id,
          'passport_number', ep.passport_number,
          'issuing_country', c.name,
          'issue_date', ep.issue_date,
          'expiry_date', ep.expiry_date,
          'status', ep.status,
          'is_current', ep.is_current,
          'document_path', ep.document_path
        )
      ), '[]'::jsonb)
      FROM employee_passports ep
      LEFT JOIN countries c ON ep.issuing_country_id = c.id
      WHERE ep.employee_id = employee_uuid
    ),
    'visas', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ev.id,
          'visa_number', ev.visa_number,
          'visa_type', vt.name,
          'issuing_country', c.name,
          'issue_date', ev.issue_date,
          'expiry_date', ev.expiry_date,
          'is_current', ev.is_current,
          'conditions', ev.conditions,
          'document_path', ev.document_path
        )
      ), '[]'::jsonb)
      FROM employee_visas ev
      LEFT JOIN visa_types vt ON ev.visa_type_id = vt.id
      LEFT JOIN countries c ON ev.issuing_country_id = c.id
      WHERE ev.employee_id = employee_uuid
    )
  );
  
  RETURN result;
END;
$$;