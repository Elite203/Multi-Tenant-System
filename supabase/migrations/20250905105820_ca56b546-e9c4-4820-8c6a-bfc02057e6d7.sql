-- Remove related_company_id column from employee_rtw_documents table
ALTER TABLE public.employee_rtw_documents 
DROP COLUMN IF EXISTS related_company_id;