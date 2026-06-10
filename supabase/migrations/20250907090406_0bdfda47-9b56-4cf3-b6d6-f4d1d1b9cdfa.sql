-- Enhance payslips table with financial and metadata fields
ALTER TABLE public.payslips 
ADD COLUMN IF NOT EXISTS net_pay DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gross_pay DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS ni DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS pension DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS other_deductions DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS pay_date DATE,
ADD COLUMN IF NOT EXISTS period TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS pay_frequency TEXT DEFAULT 'monthly' CHECK (pay_frequency IN ('monthly', 'weekly', 'fortnightly')),
ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(3,2) DEFAULT 0.0;

-- Create payslips storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payslips', 'payslips', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payslips bucket
CREATE POLICY "Admins and HR can upload payslips" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payslips' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can view all payslips" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payslips' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own payslips" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payslips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins and HR can update payslips" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'payslips' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can delete payslips" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'payslips' AND is_admin_or_hr(auth.uid()));

-- Update payslips table RLS policies for financial data access
DROP POLICY IF EXISTS "Admins and HR can insert payslips" ON public.payslips;
DROP POLICY IF EXISTS "Users can view own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Admins and HR can view all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Admins and HR can update payslips" ON public.payslips;

CREATE POLICY "Admins and HR can manage all payslips" 
ON public.payslips 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own payslips" 
ON public.payslips 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

-- Create function to update payslip statuses automatically
CREATE OR REPLACE FUNCTION public.update_payslip_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update pending payslips to paid when pay date has passed
  UPDATE public.payslips 
  SET 
    status = 'paid',
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND pay_date IS NOT NULL 
    AND pay_date <= CURRENT_DATE;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the update
  INSERT INTO public.audit_logs (
    table_name,
    action,
    new_values,
    user_id,
    created_at
  ) VALUES (
    'payslips',
    'BULK_UPDATE',
    json_build_object('updated_count', updated_count, 'action', 'auto_status_update'),
    NULL,
    now()
  );
  
  RETURN updated_count;
END;
$$;