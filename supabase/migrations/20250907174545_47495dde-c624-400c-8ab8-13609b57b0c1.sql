-- Fix ambiguous role column reference in organizational hierarchy functions

-- Fix get_organizational_hierarchy function
CREATE OR REPLACE FUNCTION public.get_organizational_hierarchy()
RETURNS TABLE (
  id UUID,
  employee_number TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  job_title_name TEXT,
  department_name TEXT,
  employee_type employee_type,
  status employee_status,
  manager_id UUID,
  manager_name TEXT,
  company_name TEXT,
  profile_photo TEXT,
  role user_role,
  level INTEGER,
  path TEXT[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE org_hierarchy AS (
    -- Base case: employees without managers (root nodes)
    SELECT 
      e.id,
      e.employee_number,
      e.first_name,
      e.last_name,
      e.email,
      jt.title as job_title_name,
      d.name as department_name,
      e.employee_type,
      e.status,
      e.manager_id,
      CAST(NULL as TEXT) as manager_name,
      c.name as company_name,
      e.profile_photo,
      COALESCE(p.role, 'employee'::user_role) as role,
      0 as level,
      ARRAY[e.id::TEXT] as path
    FROM employees e
    LEFT JOIN job_titles jt ON e.job_title = jt.id
    LEFT JOIN departments d ON e.department = d.id
    LEFT JOIN companies c ON e.company_id = c.id
    LEFT JOIN profiles p ON e.user_id = p.id
    WHERE e.manager_id IS NULL 
    AND e.status = 'active'
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT 
      e.id,
      e.employee_number,
      e.first_name,
      e.last_name,
      e.email,
      jt.title as job_title_name,
      d.name as department_name,
      e.employee_type,
      e.status,
      e.manager_id,
      oh.first_name || ' ' || oh.last_name as manager_name,
      c.name as company_name,
      e.profile_photo,
      COALESCE(p.role, 'employee'::user_role) as role,
      oh.level + 1,
      oh.path || e.id::TEXT
    FROM employees e
    LEFT JOIN job_titles jt ON e.job_title = jt.id
    LEFT JOIN departments d ON e.department = d.id
    LEFT JOIN companies c ON e.company_id = c.id
    LEFT JOIN profiles p ON e.user_id = p.id
    INNER JOIN org_hierarchy oh ON e.manager_id = oh.id
    WHERE e.status = 'active'
    AND NOT (e.id::TEXT = ANY(oh.path)) -- Prevent cycles
  )
  SELECT * FROM org_hierarchy
  ORDER BY org_hierarchy.level, 
    CASE 
      WHEN org_hierarchy.role = 'admin' THEN 1
      WHEN org_hierarchy.role = 'director' THEN 2  
      WHEN org_hierarchy.role = 'hr' THEN 3
      WHEN org_hierarchy.employee_type = 'manager' THEN 4
      ELSE 5 
    END,
    org_hierarchy.first_name, org_hierarchy.last_name;
END;
$$;

-- Fix get_direct_reports function
CREATE OR REPLACE FUNCTION public.get_direct_reports(manager_uuid UUID)
RETURNS TABLE (
  id UUID,
  employee_number TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  job_title_name TEXT,
  department_name TEXT,
  employee_type employee_type,
  status employee_status,
  company_name TEXT,
  profile_photo TEXT,
  role user_role,
  direct_reports_count INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_number,
    e.first_name,
    e.last_name,
    e.email,
    jt.title as job_title_name,
    d.name as department_name,
    e.employee_type,
    e.status,
    c.name as company_name,
    e.profile_photo,
    COALESCE(p.role, 'employee'::user_role) as role,
    (
      SELECT COUNT(*)::INTEGER 
      FROM employees sub_e 
      WHERE sub_e.manager_id = e.id 
      AND sub_e.status = 'active'
    ) as direct_reports_count
  FROM employees e
  LEFT JOIN job_titles jt ON e.job_title = jt.id
  LEFT JOIN departments d ON e.department = d.id
  LEFT JOIN companies c ON e.company_id = c.id
  LEFT JOIN profiles p ON e.user_id = p.id
  WHERE e.manager_id = manager_uuid
  AND e.status = 'active'
  ORDER BY 
    CASE 
      WHEN COALESCE(p.role, 'employee'::user_role) = 'admin' THEN 1
      WHEN COALESCE(p.role, 'employee'::user_role) = 'director' THEN 2  
      WHEN COALESCE(p.role, 'employee'::user_role) = 'hr' THEN 3
      WHEN e.employee_type = 'manager' THEN 4
      ELSE 5 
    END,
    e.first_name, e.last_name;
END;
$$;