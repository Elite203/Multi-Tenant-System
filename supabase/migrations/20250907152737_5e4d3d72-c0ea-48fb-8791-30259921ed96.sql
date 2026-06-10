-- Add missing RLS policies for payslips table
CREATE POLICY "Users can insert own payslips" 
ON public.payslips 
FOR INSERT 
WITH CHECK (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can insert any payslips" 
ON public.payslips 
FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

-- Add storage policies for payslips bucket
CREATE POLICY "Users can upload to payslips bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payslips' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view payslips in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payslips' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins and HR can manage payslips storage" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'payslips' AND is_admin_or_hr(auth.uid()));