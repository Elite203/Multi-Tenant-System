-- Fix foreign key constraints for proper metadata lookups

-- First, drop any existing constraints that might have issues
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_current_nationality CASCADE;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_sponsored_by_company CASCADE; 
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_job_title CASCADE;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_department CASCADE;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_manager CASCADE;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_company CASCADE;

-- Create proper foreign key constraints for employees table
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_current_nationality 
FOREIGN KEY (current_nationality_id) REFERENCES public.countries(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_sponsored_by_company 
FOREIGN KEY (sponsored_by_company_id) REFERENCES public.companies(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_job_title 
FOREIGN KEY (job_title) REFERENCES public.job_titles(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_department 
FOREIGN KEY (department) REFERENCES public.departments(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_manager 
FOREIGN KEY (manager_id) REFERENCES public.employees(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id);