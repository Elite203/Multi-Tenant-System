-- Remove duplicate address column from employees table
-- The table already has split address fields: street_address, address_line_2, city, state_province, postal_code, country_id
ALTER TABLE public.employees DROP COLUMN IF EXISTS address;