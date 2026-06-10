-- Make national_insurance_number column NOT NULL in employees table
-- First add a default value for existing records that might have NULL values
UPDATE public.employees 
SET national_insurance_number = 'PENDING' 
WHERE national_insurance_number IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.employees 
ALTER COLUMN national_insurance_number SET NOT NULL;