-- Update employee_visas table to use proper country foreign key
-- Drop the text issuing_country column and make issuing_country_id NOT NULL
ALTER TABLE public.employee_visas 
DROP COLUMN IF EXISTS issuing_country;

-- Make issuing_country_id NOT NULL and add foreign key constraint if not exists
ALTER TABLE public.employee_visas 
ALTER COLUMN issuing_country_id SET NOT NULL;

-- Add foreign key constraint to countries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_visas_issuing_country_id_fkey'
    ) THEN
        ALTER TABLE public.employee_visas 
        ADD CONSTRAINT employee_visas_issuing_country_id_fkey 
        FOREIGN KEY (issuing_country_id) REFERENCES public.countries(id);
    END IF;
END $$;