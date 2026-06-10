-- First, update all existing immigration_status values to valid enum values
UPDATE public.employees 
SET immigration_status = 'pending_review'
WHERE immigration_status NOT IN ('pending_review', 'approved', 'rejected', 'expired', 'requires_renewal');

-- Remove the default value temporarily
ALTER TABLE public.employees 
ALTER COLUMN immigration_status DROP DEFAULT;

-- Change immigration_status column to use enum instead of text
ALTER TABLE public.employees 
ALTER COLUMN immigration_status TYPE immigration_status_enum 
USING immigration_status::immigration_status_enum;

-- Set the new default value
ALTER TABLE public.employees 
ALTER COLUMN immigration_status SET DEFAULT 'pending_review'::immigration_status_enum;

-- Create function to calculate immigration status based on documents
CREATE OR REPLACE FUNCTION public.calculate_immigration_status(employee_uuid uuid)
RETURNS immigration_status_enum
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  passport_expired boolean := false;
  passport_expiring_soon boolean := false;
  visa_expired boolean := false;
  visa_expiring_soon boolean := false;
  rtw_expired boolean := false;
  rtw_expiring_soon boolean := false;
  rtw_invalid boolean := false;
  cos_inactive boolean := false;
  has_valid_passport boolean := false;
  has_valid_visa boolean := false;
  has_valid_rtw boolean := false;
  has_active_cos boolean := false;
BEGIN
  -- Check current passport status
  SELECT 
    CASE WHEN expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    true
  INTO passport_expired, passport_expiring_soon, has_valid_passport
  FROM public.employee_passports 
  WHERE employee_id = employee_uuid AND is_current = true AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check current visa status
  SELECT 
    CASE WHEN expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    true
  INTO visa_expired, visa_expiring_soon, has_valid_visa
  FROM public.employee_visas 
  WHERE employee_id = employee_uuid AND is_current = true
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check RTW document status
  SELECT 
    CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    CASE WHEN is_valid = false THEN true ELSE false END,
    true
  INTO rtw_expired, rtw_expiring_soon, rtw_invalid, has_valid_rtw
  FROM public.employee_rtw_documents 
  WHERE employee_id = employee_uuid AND is_current_active = true AND status = 'Active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check COS document status
  SELECT 
    CASE WHEN cos_status IN ('Inactive', 'Expired', 'Archived') THEN true ELSE false END,
    true
  INTO cos_inactive, has_active_cos
  FROM public.employee_cos_documents 
  WHERE employee_id = employee_uuid AND cos_status = 'Active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Determine status based on priority logic
  -- 1. Expired documents (highest priority)
  IF passport_expired OR visa_expired OR rtw_expired THEN
    RETURN 'expired'::immigration_status_enum;
  END IF;

  -- 2. Invalid/inactive documents
  IF rtw_invalid OR cos_inactive THEN
    RETURN 'rejected'::immigration_status_enum;
  END IF;

  -- 3. Documents expiring soon
  IF passport_expiring_soon OR visa_expiring_soon OR rtw_expiring_soon THEN
    RETURN 'requires_renewal'::immigration_status_enum;
  END IF;

  -- 4. All required documents present and valid
  IF has_valid_passport AND (has_valid_visa OR has_valid_rtw) THEN
    RETURN 'approved'::immigration_status_enum;
  END IF;

  -- 5. Default: pending review (missing or incomplete documents)
  RETURN 'pending_review'::immigration_status_enum;
END;
$$;

-- Create function to update employee immigration status
CREATE OR REPLACE FUNCTION public.update_employee_immigration_status(employee_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employees 
  SET 
    immigration_status = calculate_immigration_status(employee_uuid),
    updated_at = now()
  WHERE id = employee_uuid;
END;
$$;

-- Create trigger function for document changes
CREATE OR REPLACE FUNCTION public.trigger_update_immigration_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For INSERT and UPDATE operations
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM update_employee_immigration_status(NEW.employee_id);
    RETURN NEW;
  END IF;
  
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    PERFORM update_employee_immigration_status(OLD.employee_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers on all immigration document tables
CREATE TRIGGER passport_immigration_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_passports
  FOR EACH ROW EXECUTE FUNCTION trigger_update_immigration_status();

CREATE TRIGGER visa_immigration_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_visas
  FOR EACH ROW EXECUTE FUNCTION trigger_update_immigration_status();

CREATE TRIGGER rtw_immigration_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_rtw_documents
  FOR EACH ROW EXECUTE FUNCTION trigger_update_immigration_status();

CREATE TRIGGER cos_immigration_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_cos_documents
  FOR EACH ROW EXECUTE FUNCTION trigger_update_immigration_status();

-- Update all existing employee immigration statuses based on their documents
UPDATE public.employees 
SET immigration_status = calculate_immigration_status(id)
WHERE id IS NOT NULL;