-- Add new columns to employee_rtw_documents table
ALTER TABLE public.employee_rtw_documents 
ADD COLUMN IF NOT EXISTS rtw_reference text,
ADD COLUMN IF NOT EXISTS rtw_status text,
ADD COLUMN IF NOT EXISTS share_code text,
ADD COLUMN IF NOT EXISTS is_current_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS related_company_id uuid REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- Add check constraint for status values
ALTER TABLE public.employee_rtw_documents 
ADD CONSTRAINT employee_rtw_documents_status_check 
CHECK (status IN ('Active', 'Inactive', 'Expired', 'Archived'));

-- Create index for better performance on company lookup
CREATE INDEX IF NOT EXISTS idx_employee_rtw_documents_company 
ON public.employee_rtw_documents(related_company_id);

-- Update RLS policies to include company data
DROP POLICY IF EXISTS "Admins and HR can manage RTW documents" ON public.employee_rtw_documents;
DROP POLICY IF EXISTS "Users can view own RTW documents" ON public.employee_rtw_documents;

CREATE POLICY "Admins and HR can manage RTW documents" 
ON public.employee_rtw_documents 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own RTW documents" 
ON public.employee_rtw_documents 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));