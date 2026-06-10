-- Remove fields from employee_cos_documents table
ALTER TABLE public.employee_cos_documents 
DROP COLUMN IF EXISTS issue_date,
DROP COLUMN IF EXISTS expiry_date,
DROP COLUMN IF EXISTS salary,
DROP COLUMN IF EXISTS job_title;