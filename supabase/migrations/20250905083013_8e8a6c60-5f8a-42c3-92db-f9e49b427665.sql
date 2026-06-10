-- Update employee_visas table to use visa_type_id foreign key instead of text field
-- Drop the text visa_type column and add visa_type_id
ALTER TABLE public.employee_visas 
DROP COLUMN IF EXISTS visa_type;

-- Add visa_type_id column as foreign key to visa_types
ALTER TABLE public.employee_visas 
ADD COLUMN visa_type_id UUID;

-- Add foreign key constraint to visa_types table
ALTER TABLE public.employee_visas 
ADD CONSTRAINT employee_visas_visa_type_id_fkey 
FOREIGN KEY (visa_type_id) REFERENCES public.visa_types(id);