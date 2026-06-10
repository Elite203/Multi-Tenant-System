-- Fix passport table schema - remove old issuing_country column and make issuing_country_id NOT NULL
ALTER TABLE public.employee_passports 
DROP COLUMN IF EXISTS issuing_country;

-- Make issuing_country_id NOT NULL since it's required
ALTER TABLE public.employee_passports 
ALTER COLUMN issuing_country_id SET NOT NULL;