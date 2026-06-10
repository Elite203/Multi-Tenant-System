-- Fix remaining security functions that need search_path set

-- Fix all remaining functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.can_view_sensitive_field(user_uuid uuid, field_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN field_type IN ('salary', 'bank_details') THEN is_admin_or_hr(user_uuid)
    WHEN field_type = 'immigration' THEN is_admin_or_hr(user_uuid) 
    ELSE true
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_archive_records(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.can_hard_delete(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_default_company()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.companies WHERE parent_company_id IS NULL AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(nextval('employee_number_seq')::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_primary_bank_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is being set as primary, unset all other primary accounts for this employee
  IF NEW.is_primary = true THEN
    UPDATE public.employee_bank_details 
    SET is_primary = false 
    WHERE employee_id = NEW.employee_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  
  -- Ensure at least one primary account exists if this is the only active account
  IF NEW.is_primary = false THEN
    -- Check if there are any other primary accounts
    IF NOT EXISTS (
      SELECT 1 FROM public.employee_bank_details 
      WHERE employee_id = NEW.employee_id 
      AND id != NEW.id 
      AND is_primary = true 
      AND is_active = true
    ) THEN
      -- If no other primary accounts, make this one primary
      NEW.is_primary = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;