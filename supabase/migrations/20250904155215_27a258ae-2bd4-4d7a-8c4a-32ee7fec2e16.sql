-- Complete essential schema updates

-- Create employee_types table
CREATE TABLE IF NOT EXISTS public.employee_types (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    is_manager boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on employee_types
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_types
CREATE POLICY "Admins and HR can manage employee types" 
ON public.employee_types 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view employee types" 
ON public.employee_types 
FOR SELECT 
USING (true);

-- Insert default employee types
INSERT INTO public.employee_types (name, description, is_manager) VALUES 
('staff', 'Regular Staff Member', false),
('manager', 'Manager', true),
('director', 'Director', true),
('contractor', 'Contractor', false),
('intern', 'Intern', false)
ON CONFLICT DO NOTHING;

-- Add basic company fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employee_count integer DEFAULT 0;

-- Add basic employee fields  
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_photo text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS current_nationality_id uuid REFERENCES public.countries(id);

-- Create payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month integer NOT NULL,
    year integer NOT NULL,
    notes text,
    attachment_path text,
    status text DEFAULT 'draft',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(employee_id, month, year)
);

-- Enable RLS on payslips
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Create policies for payslips
CREATE POLICY "Admins and HR can manage payslips" 
ON public.payslips 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own payslips" 
ON public.payslips 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

-- Create triggers
CREATE TRIGGER update_employee_types_updated_at
    BEFORE UPDATE ON public.employee_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON public.payslips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update employee count for companies
UPDATE public.companies SET employee_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.employees 
    WHERE company_id = companies.id AND status = 'active'
), 0);