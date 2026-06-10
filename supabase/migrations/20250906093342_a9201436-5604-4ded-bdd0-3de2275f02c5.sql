-- Fix security issues from linter - corrected version

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
  -- Work profile fields from work_profiles table
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
  ewp.work_location,
  ewp.weekly_working_hours
FROM employees e
LEFT JOIN companies c ON e.company_id = c.id
LEFT JOIN job_titles jt ON e.job_title = jt.id
LEFT JOIN departments d ON e.department = d.id
LEFT JOIN countries cn ON e.current_nationality_id = cn.id
LEFT JOIN companies sc ON e.sponsored_by_company_id = sc.id
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_work_profiles ewp ON e.id = ewp.employee_id;