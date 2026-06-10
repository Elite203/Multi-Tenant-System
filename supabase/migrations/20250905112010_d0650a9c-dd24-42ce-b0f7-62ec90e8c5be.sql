-- Fix function search path security warning by explicitly setting search_path for all functions
-- Update the calculate_immigration_status function to have proper search_path setting
CREATE OR REPLACE FUNCTION public.calculate_immigration_status(employee_uuid uuid)
RETURNS immigration_status_enum
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
  FROM employee_passports 
  WHERE employee_id = employee_uuid AND is_current = true AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check current visa status
  SELECT 
    CASE WHEN expiry_date < CURRENT_DATE THEN true ELSE false END,
    CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN true ELSE false END,
    true
  INTO visa_expired, visa_expiring_soon, has_valid_visa
  FROM employee_visas 
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
  FROM employee_rtw_documents 
  WHERE employee_id = employee_uuid AND is_current_active = true AND status = 'Active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check COS document status
  SELECT 
    CASE WHEN cos_status IN ('Inactive', 'Expired', 'Archived') THEN true ELSE false END,
    true
  INTO cos_inactive, has_active_cos
  FROM employee_cos_documents 
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

-- Update the update_employee_immigration_status function to have proper search_path setting
CREATE OR REPLACE FUNCTION public.update_employee_immigration_status(employee_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE employees 
  SET 
    immigration_status = calculate_immigration_status(employee_uuid),
    updated_at = now()
  WHERE id = employee_uuid;
END;
$$;

-- Update the trigger function to have proper search_path setting
CREATE OR REPLACE FUNCTION public.trigger_update_immigration_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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