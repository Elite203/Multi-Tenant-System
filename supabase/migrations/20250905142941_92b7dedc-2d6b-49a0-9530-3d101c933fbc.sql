-- Update the employee_complete_view to include national_insurance_number from employees table
CREATE OR REPLACE VIEW public.employee_complete_view AS
SELECT 
  e.id,
  e.employee_number,
  e.first_name,
  e.last_name,
  e.email,
  e.phone,
  e.address,
  e.national_insurance_number,
  e.profile_photo,
  e.date_of_birth,
  e.hire_date,
  e.employee_type,
  e.status,
  e.manager_id,
  e.salary,
  e.created_at,
  e.updated_at,
  e.immigration_status,
  e.compliance_score,
  e.archived_at,
  e.archived_by,
  e.user_id,
  e.company_id,
  e.department,
  e.job_title,
  e.current_nationality_id,
  e.sponsored_by_company_id,
  e.start_date,
  e.leave_entitlement,
  e.remaining_leaves,
  
  -- Company information
  c.name as company_name,
  
  -- Job title information
  jt.title as job_title_name,
  
  -- Department information
  d.name as department_name,
  
  -- Current nationality information
  cn.name as current_nationality_name,
  
  -- Sponsored by company information
  sbc.name as sponsored_by_company_name,
  
  -- Manager information
  m.first_name as manager_first_name,
  m.last_name as manager_last_name,
  m.employee_number as manager_employee_number,
  
  -- Work profile information
  wp.soc_number,
  wp.work_email,
  wp.work_phone,
  wp.work_location,
  wp.weekly_working_hours,
  wp.sponsored_by_company_id as work_sponsored_by_company_id,
  wp.skills,
  wp.languages,
  wp.work_preferences,
  wp.career_goals,
  wp.remote_work_preference,
  wp.travel_willingness,
  wp.availability,
  wp.performance_metrics
  
FROM public.employees e
LEFT JOIN public.companies c ON e.company_id = c.id
LEFT JOIN public.job_titles jt ON e.job_title = jt.id
LEFT JOIN public.departments d ON e.department = d.id
LEFT JOIN public.countries cn ON e.current_nationality_id = cn.id
LEFT JOIN public.companies sbc ON e.sponsored_by_company_id = sbc.id
LEFT JOIN public.employees m ON e.manager_id = m.id
LEFT JOIN public.employee_work_profiles wp ON e.id = wp.employee_id;