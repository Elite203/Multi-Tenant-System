-- Update the validate_employee_data function to normalize National Insurance Number by removing spaces
CREATE OR REPLACE FUNCTION public.validate_employee_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Normalize and validate NI number format (basic UK format)
  IF NEW.national_insurance_number IS NOT NULL THEN
    -- Remove spaces and convert to uppercase for validation
    NEW.national_insurance_number := UPPER(REPLACE(NEW.national_insurance_number, ' ', ''));
    
    -- Validate the normalized format
    IF NEW.national_insurance_number !~ '^[A-Z]{2}[0-9]{6}[A-Z]?$' THEN
      RAISE EXCEPTION 'Invalid National Insurance Number format';
    END IF;
  END IF;

  -- Validate email format
  IF NEW.email IS NOT NULL AND 
     NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Ensure manager is not self
  IF NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'Employee cannot be their own manager';
  END IF;

  RETURN NEW;
END;
$function$;