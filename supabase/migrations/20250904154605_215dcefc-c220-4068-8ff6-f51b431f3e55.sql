-- First, let's add the new foreign key columns alongside existing text columns
ALTER TABLE public.employees 
ADD COLUMN department_id uuid REFERENCES public.departments(id),
ADD COLUMN job_title_id uuid REFERENCES public.job_titles(id);

ALTER TABLE public.employee_job_history 
ADD COLUMN department_id uuid REFERENCES public.departments(id),
ADD COLUMN job_title_id uuid REFERENCES public.job_titles(id);

ALTER TABLE public.employee_cos_documents 
ADD COLUMN job_title_id uuid REFERENCES public.job_titles(id);

-- Function to find or create department by name
CREATE OR REPLACE FUNCTION find_or_create_department(dept_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    dept_id uuid;
BEGIN
    IF dept_name IS NULL OR trim(dept_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Try to find existing department (case insensitive)
    SELECT id INTO dept_id 
    FROM public.departments 
    WHERE lower(name) = lower(trim(dept_name))
    LIMIT 1;
    
    -- If not found, create new department
    IF dept_id IS NULL THEN
        INSERT INTO public.departments (name, is_active)
        VALUES (trim(dept_name), true)
        RETURNING id INTO dept_id;
    END IF;
    
    RETURN dept_id;
END;
$$;

-- Function to find or create job title by name
CREATE OR REPLACE FUNCTION find_or_create_job_title(title_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    title_id uuid;
BEGIN
    IF title_name IS NULL OR trim(title_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Try to find existing job title (case insensitive)
    SELECT id INTO title_id 
    FROM public.job_titles 
    WHERE lower(title) = lower(trim(title_name))
    LIMIT 1;
    
    -- If not found, create new job title
    IF title_id IS NULL THEN
        INSERT INTO public.job_titles (title, is_active)
        VALUES (trim(title_name), true)
        RETURNING id INTO title_id;
    END IF;
    
    RETURN title_id;
END;
$$;

-- Migrate existing data for employees table
UPDATE public.employees 
SET department_id = find_or_create_department(department)
WHERE department IS NOT NULL;

UPDATE public.employees 
SET job_title_id = find_or_create_job_title(job_title)
WHERE job_title IS NOT NULL;

-- Migrate existing data for employee_job_history table
UPDATE public.employee_job_history 
SET department_id = find_or_create_department(department)
WHERE department IS NOT NULL;

UPDATE public.employee_job_history 
SET job_title_id = find_or_create_job_title(job_title)
WHERE job_title IS NOT NULL;

-- Migrate existing data for employee_cos_documents table
UPDATE public.employee_cos_documents 
SET job_title_id = find_or_create_job_title(job_title)
WHERE job_title IS NOT NULL;

-- Now drop the old text columns and rename the new ones
ALTER TABLE public.employees 
DROP COLUMN department,
DROP COLUMN job_title;

ALTER TABLE public.employees 
RENAME COLUMN department_id TO department;

ALTER TABLE public.employees 
RENAME COLUMN job_title_id TO job_title;

ALTER TABLE public.employee_job_history 
DROP COLUMN department,
DROP COLUMN job_title;

ALTER TABLE public.employee_job_history 
RENAME COLUMN department_id TO department;

ALTER TABLE public.employee_job_history 
RENAME COLUMN job_title_id TO job_title;

ALTER TABLE public.employee_cos_documents 
DROP COLUMN job_title;

ALTER TABLE public.employee_cos_documents 
RENAME COLUMN job_title_id TO job_title;

-- Clean up helper functions
DROP FUNCTION find_or_create_department(text);
DROP FUNCTION find_or_create_job_title(text);