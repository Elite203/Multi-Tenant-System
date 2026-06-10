-- Remove document_type column from employee_rtw_documents table
ALTER TABLE public.employee_rtw_documents 
DROP COLUMN IF EXISTS document_type;