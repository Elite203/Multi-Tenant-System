-- Fix missing columns and complete schema implementation

-- First ensure companies table has all new columns
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS holding_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address_line_1 text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address_line_2 text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS director text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employee_count integer DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Fix employee type conversion
UPDATE public.employees SET employee_type = 'staff'::employee_type WHERE employee_type IS NULL;

-- Ensure employees table has all new columns  
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_photo text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sponsored_by_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS current_nationality_id uuid REFERENCES public.countries(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS leave_entitlement jsonb DEFAULT '{}';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS remaining_leaves jsonb DEFAULT '{}';

-- Add employee types management to MetadataManagement
ALTER TABLE public.employee_types ADD COLUMN IF NOT EXISTS is_manager boolean DEFAULT false;

-- Update manager employees
UPDATE public.employee_types SET is_manager = true WHERE name = 'manager';

-- Create company attachments table
CREATE TABLE IF NOT EXISTS public.company_attachments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    content_type text,
    category text DEFAULT 'general',
    uploaded_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on company_attachments
ALTER TABLE public.company_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for company_attachments
CREATE POLICY "Admins and HR can manage company attachments" 
ON public.company_attachments 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view company attachments" 
ON public.company_attachments 
FOR SELECT 
USING (true);

-- Create trigger for company_attachments updated_at
CREATE TRIGGER update_company_attachments_updated_at
    BEFORE UPDATE ON public.company_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Now update the employee count for all companies
UPDATE public.companies SET employee_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.employees 
    WHERE company_id = companies.id AND status = 'active'
), 0);