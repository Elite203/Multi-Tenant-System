-- Add foreign key constraints for proper metadata lookups

-- Add foreign key for current nationality
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_current_nationality 
FOREIGN KEY (current_nationality_id) REFERENCES public.countries(id);

-- Add foreign key for sponsored by company
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_sponsored_by_company 
FOREIGN KEY (sponsored_by_company_id) REFERENCES public.companies(id);

-- Add foreign key for job title
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_job_title 
FOREIGN KEY (job_title) REFERENCES public.job_titles(id);

-- Add foreign key for department
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_department 
FOREIGN KEY (department) REFERENCES public.departments(id);

-- Add foreign key for manager
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_manager 
FOREIGN KEY (manager_id) REFERENCES public.employees(id);

-- Add foreign key for company
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Add foreign key constraints for employee_passports
ALTER TABLE public.employee_passports 
ADD CONSTRAINT fk_employee_passports_nationality 
FOREIGN KEY (nationality_id) REFERENCES public.countries(id);

ALTER TABLE public.employee_passports 
ADD CONSTRAINT fk_employee_passports_issuing_country 
FOREIGN KEY (issuing_country_id) REFERENCES public.countries(id);

-- Add foreign key constraints for employee_visas
ALTER TABLE public.employee_visas 
ADD CONSTRAINT fk_employee_visas_issuing_country 
FOREIGN KEY (issuing_country_id) REFERENCES public.countries(id);

-- Add foreign key constraints for companies
ALTER TABLE public.companies 
ADD CONSTRAINT fk_companies_country 
FOREIGN KEY (country_id) REFERENCES public.countries(id);

ALTER TABLE public.companies 
ADD CONSTRAINT fk_companies_parent 
FOREIGN KEY (parent_company_id) REFERENCES public.companies(id);

-- Add foreign key constraints for job titles
ALTER TABLE public.job_titles 
ADD CONSTRAINT fk_job_titles_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Add foreign key constraints for employee_cos_documents
ALTER TABLE public.employee_cos_documents 
ADD CONSTRAINT fk_employee_cos_documents_job_title 
FOREIGN KEY (job_title) REFERENCES public.job_titles(id);

-- Add foreign key constraints for employee_job_history
ALTER TABLE public.employee_job_history 
ADD CONSTRAINT fk_employee_job_history_job_title 
FOREIGN KEY (job_title) REFERENCES public.job_titles(id);

ALTER TABLE public.employee_job_history 
ADD CONSTRAINT fk_employee_job_history_department 
FOREIGN KEY (department) REFERENCES public.departments(id);