-- Phase 1: Core Infrastructure Updates

-- Create storage buckets for company documents and employee photos
INSERT INTO storage.buckets (id, name, public) VALUES 
('company-documents', 'company-documents', false),
('employee-photos', 'employee-photos', true);

-- Create storage policies for company documents
CREATE POLICY "Admins and HR can upload company documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can view company documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update company documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can delete company documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

-- Create storage policies for employee photos
CREATE POLICY "Employee photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins and HR can upload employee photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-photos' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can upload their own photo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins and HR can update employee photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee-photos' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can update their own photo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update companies table with new fields
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

-- Update employees table with new fields
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_photo text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sponsored_by_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS current_nationality_id uuid REFERENCES public.countries(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS leave_entitlement jsonb DEFAULT '{}';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS remaining_leaves jsonb DEFAULT '{}';

-- Create employee_types metadata table
CREATE TABLE IF NOT EXISTS public.employee_types (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
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
INSERT INTO public.employee_types (name, description) VALUES 
('staff', 'Regular Staff Member'),
('manager', 'Manager'),
('director', 'Director'),
('contractor', 'Contractor'),
('intern', 'Intern')
ON CONFLICT DO NOTHING;

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

-- Create trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for employee_types updated_at
CREATE TRIGGER update_employee_types_updated_at
    BEFORE UPDATE ON public.employee_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for payslips updated_at
CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON public.payslips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update employee count for companies
CREATE OR REPLACE FUNCTION update_company_employee_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update count for old company (if exists)
    IF OLD.company_id IS NOT NULL THEN
        UPDATE public.companies 
        SET employee_count = (
            SELECT COUNT(*) 
            FROM public.employees 
            WHERE company_id = OLD.company_id 
            AND status = 'active'
        )
        WHERE id = OLD.company_id;
    END IF;
    
    -- Update count for new company (if exists)
    IF NEW.company_id IS NOT NULL THEN
        UPDATE public.companies 
        SET employee_count = (
            SELECT COUNT(*) 
            FROM public.employees 
            WHERE company_id = NEW.company_id 
            AND status = 'active'
        )
        WHERE id = NEW.company_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic employee count updates
DROP TRIGGER IF EXISTS trigger_update_company_employee_count ON public.employees;
CREATE TRIGGER trigger_update_company_employee_count
    AFTER INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_company_employee_count();