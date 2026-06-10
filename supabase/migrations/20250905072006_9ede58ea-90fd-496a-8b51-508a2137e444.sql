-- Add missing columns to employee_passports table
ALTER TABLE public.employee_passports 
ADD COLUMN place_of_birth text,
ADD COLUMN issuing_authority text,
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'archived'));

-- Update existing records to have default status
UPDATE public.employee_passports 
SET status = 'active' 
WHERE status IS NULL;