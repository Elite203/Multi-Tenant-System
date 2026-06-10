-- Create enhanced permission functions for archive vs delete operations
CREATE OR REPLACE FUNCTION public.is_admin_only(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$function$;

-- Function to check if user can archive records (admin and HR)
CREATE OR REPLACE FUNCTION public.can_archive_records(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$function$;

-- Function to check if user can hard delete (admin only)
CREATE OR REPLACE FUNCTION public.can_hard_delete(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$function$;

-- Add archive fields to employees table if not exists
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Add archive fields to other employee tables
ALTER TABLE public.employee_certifications 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE public.employee_training 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE public.employee_education 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE public.employee_bank_details 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Update RLS policies for employees table to separate archive and delete
DROP POLICY IF EXISTS "Admins and HR can modify employees" ON public.employees;

-- Create separate policies for different operations
CREATE POLICY "Admins and HR can select employees" 
ON public.employees FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can insert employees" 
ON public.employees FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update employees" 
ON public.employees FOR UPDATE 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can delete employees" 
ON public.employees FOR DELETE 
USING (is_admin_only(auth.uid()));

-- Update other employee table policies
-- Employee certifications
DROP POLICY IF EXISTS "Admins and HR can manage certifications" ON public.employee_certifications;

CREATE POLICY "Admins and HR can select certifications" 
ON public.employee_certifications FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can insert certifications" 
ON public.employee_certifications FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update certifications" 
ON public.employee_certifications FOR UPDATE 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can delete certifications" 
ON public.employee_certifications FOR DELETE 
USING (is_admin_only(auth.uid()));

-- Employee training
DROP POLICY IF EXISTS "Admins and HR can manage training records" ON public.employee_training;

CREATE POLICY "Admins and HR can select training" 
ON public.employee_training FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can insert training" 
ON public.employee_training FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update training" 
ON public.employee_training FOR UPDATE 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can delete training" 
ON public.employee_training FOR DELETE 
USING (is_admin_only(auth.uid()));

-- Employee education
DROP POLICY IF EXISTS "Admins and HR can manage education records" ON public.employee_education;

CREATE POLICY "Admins and HR can select education" 
ON public.employee_education FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can insert education" 
ON public.employee_education FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update education" 
ON public.employee_education FOR UPDATE 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can delete education" 
ON public.employee_education FOR DELETE 
USING (is_admin_only(auth.uid()));

-- Employee bank details
DROP POLICY IF EXISTS "Admins and HR can manage bank details" ON public.employee_bank_details;

CREATE POLICY "Admins and HR can select bank details" 
ON public.employee_bank_details FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can insert bank details" 
ON public.employee_bank_details FOR INSERT 
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update bank details" 
ON public.employee_bank_details FOR UPDATE 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Only admins can delete bank details" 
ON public.employee_bank_details FOR DELETE 
USING (is_admin_only(auth.uid()));

-- Create function to archive employee records
CREATE OR REPLACE FUNCTION public.archive_employee_record(
  table_name text,
  record_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user can archive records
  IF NOT can_archive_records(user_id) THEN
    RAISE EXCEPTION 'User does not have permission to archive records';
  END IF;

  -- Archive the record based on table name
  CASE table_name
    WHEN 'employees' THEN
      UPDATE employees 
      SET status = 'archived', archived_at = now(), archived_by = user_id 
      WHERE id = record_id;
    WHEN 'employee_certifications' THEN
      UPDATE employee_certifications 
      SET is_active = false, archived_at = now(), archived_by = user_id 
      WHERE id = record_id;
    WHEN 'employee_training' THEN
      UPDATE employee_training 
      SET archived_at = now(), archived_by = user_id 
      WHERE id = record_id;
    WHEN 'employee_education' THEN
      UPDATE employee_education 
      SET archived_at = now(), archived_by = user_id 
      WHERE id = record_id;
    WHEN 'employee_bank_details' THEN
      UPDATE employee_bank_details 
      SET is_active = false, archived_at = now(), archived_by = user_id 
      WHERE id = record_id;
    ELSE
      RAISE EXCEPTION 'Table % not supported for archiving', table_name;
  END CASE;
END;
$function$;