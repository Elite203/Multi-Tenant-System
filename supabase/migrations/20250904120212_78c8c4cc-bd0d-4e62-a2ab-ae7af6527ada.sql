-- Fix search_path security warnings for all functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_default_company()
RETURNS UUID AS $$
  SELECT id FROM public.companies WHERE parent_company_id IS NULL AND is_active = true LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_company_limits()
RETURNS TRIGGER AS $$
DECLARE
  parent_count INTEGER;
  child_count INTEGER;
  max_parents INTEGER;
  max_children INTEGER;
BEGIN
  -- Get limits from settings
  SELECT (setting_value->>'value')::INTEGER INTO max_parents 
  FROM public.system_settings WHERE setting_key = 'max_parent_companies';
  
  SELECT (setting_value->>'value')::INTEGER INTO max_children
  FROM public.system_settings WHERE setting_key = 'max_child_companies';

  -- Check parent company limits
  IF NEW.parent_company_id IS NULL THEN
    SELECT COUNT(*) INTO parent_count 
    FROM public.companies WHERE parent_company_id IS NULL AND is_active = true;
    
    IF parent_count >= max_parents THEN
      RAISE EXCEPTION 'Maximum number of parent companies (%) exceeded', max_parents;
    END IF;
  ELSE
    -- Check child company limits
    SELECT COUNT(*) INTO child_count
    FROM public.companies WHERE parent_company_id = NEW.parent_company_id AND is_active = true;
    
    IF child_count >= max_children THEN
      RAISE EXCEPTION 'Maximum number of child companies (%) exceeded for parent company', max_children;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;