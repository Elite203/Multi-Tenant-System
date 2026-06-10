-- Remove national_insurance_number column from employee_work_profiles table
ALTER TABLE public.employee_work_profiles 
DROP COLUMN IF EXISTS national_insurance_number;