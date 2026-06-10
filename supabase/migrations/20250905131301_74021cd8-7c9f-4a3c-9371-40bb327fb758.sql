-- Fix security definer view issue by dropping and recreating as a regular view
DROP VIEW IF EXISTS employee_complete_view;

-- Create a regular view without security definer
CREATE VIEW employee_complete_view AS
SELECT 
  e.*,
  c.name as company_name,
  jt.title as job_title_name,
  d.name as department_name,
  cn.name as current_nationality_name,
  sc.name as sponsored_by_company_name,
  m.first_name as manager_first_name,
  m.last_name as manager_last_name,
  m.employee_number as manager_employee_number,
  -- Aggregate work profile data
  wp.skills,
  wp.work_preferences,
  wp.performance_metrics,
  wp.career_goals,
  wp.availability,
  wp.remote_work_preference,
  wp.travel_willingness,
  wp.languages,
  wp.work_location,
  wp.work_phone,
  wp.work_email,
  wp.national_insurance_number as work_ni_number,
  wp.soc_number,
  wp.weekly_working_hours,
  wp.sponsored_by_company_id as work_sponsored_by_company_id
FROM employees e
LEFT JOIN companies c ON e.company_id = c.id
LEFT JOIN job_titles jt ON e.job_title = jt.id
LEFT JOIN departments d ON e.department = d.id
LEFT JOIN countries cn ON e.current_nationality_id = cn.id
LEFT JOIN companies sc ON e.sponsored_by_company_id = sc.id
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_work_profiles wp ON e.id = wp.employee_id;