-- Phase 1: Complete Company Schema
-- Add missing fields to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS holding_company_id UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state_province TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country_id UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS director TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create company_attachments table
CREATE TABLE IF NOT EXISTS public.company_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  category TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
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

-- Phase 2: Complete Employee Schema
-- Add missing fields to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sponsored_by_company_id UUID;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS leave_entitlement NUMERIC DEFAULT 25;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS remaining_leaves NUMERIC DEFAULT 25;

-- Create enhanced enums for document statuses
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'under_review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE immigration_status_enum AS ENUM ('pending_review', 'approved', 'rejected', 'expired', 'requires_renewal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update immigration_documents table with enhanced fields
ALTER TABLE public.immigration_documents ADD COLUMN IF NOT EXISTS document_status document_status DEFAULT 'pending';
ALTER TABLE public.immigration_documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.immigration_documents ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE public.immigration_documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update employee_passports table with country references
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS issuing_country_id UUID;
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS nationality_id UUID;

-- Update employee_visas table with country references
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS issuing_country_id UUID;
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS valid_for_countries UUID[];

-- Update employee_bank_details with enhanced fields
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS bank_address TEXT;
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'GBP';
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('company-logos', 'company-logos', true),
  ('company-documents', 'company-documents', false),
  ('employee-photos', 'employee-photos', true),
  ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for company logos
CREATE POLICY "Company logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Admins and HR can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-logos' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND is_admin_or_hr(auth.uid()));

-- Create storage policies for company documents
CREATE POLICY "Admins and HR can view company documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can upload company documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-documents' AND is_admin_or_hr(auth.uid()));

-- Create storage policies for employee photos
CREATE POLICY "Employee photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins and HR can upload employee photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-photos' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can upload own photo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for employee documents
CREATE POLICY "Admins and HR can view employee documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins and HR can upload employee documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can upload own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Phase 3: Enhanced Business Logic
-- Create function to enforce primary bank account rules
CREATE OR REPLACE FUNCTION public.enforce_primary_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is being set as primary, unset all other primary accounts for this employee
  IF NEW.is_primary = true THEN
    UPDATE public.employee_bank_details 
    SET is_primary = false 
    WHERE employee_id = NEW.employee_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  
  -- Ensure at least one primary account exists if this is the only active account
  IF NEW.is_primary = false THEN
    -- Check if there are any other primary accounts
    IF NOT EXISTS (
      SELECT 1 FROM public.employee_bank_details 
      WHERE employee_id = NEW.employee_id 
      AND id != NEW.id 
      AND is_primary = true 
      AND is_active = true
    ) THEN
      -- If no other primary accounts, make this one primary
      NEW.is_primary = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary bank account enforcement
DROP TRIGGER IF EXISTS enforce_primary_bank_account_trigger ON public.employee_bank_details;
CREATE TRIGGER enforce_primary_bank_account_trigger
  BEFORE INSERT OR UPDATE ON public.employee_bank_details
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_primary_bank_account();

-- Update company_attachments trigger
CREATE TRIGGER update_company_attachments_updated_at
  BEFORE UPDATE ON public.company_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints where applicable
ALTER TABLE public.companies 
ADD CONSTRAINT fk_companies_country 
FOREIGN KEY (country_id) REFERENCES public.countries(id);

ALTER TABLE public.companies 
ADD CONSTRAINT fk_companies_holding_company 
FOREIGN KEY (holding_company_id) REFERENCES public.companies(id);

ALTER TABLE public.employee_passports 
ADD CONSTRAINT fk_employee_passports_issuing_country 
FOREIGN KEY (issuing_country_id) REFERENCES public.countries(id);

ALTER TABLE public.employee_passports 
ADD CONSTRAINT fk_employee_passports_nationality 
FOREIGN KEY (nationality_id) REFERENCES public.countries(id);

ALTER TABLE public.employee_visas 
ADD CONSTRAINT fk_employee_visas_issuing_country 
FOREIGN KEY (issuing_country_id) REFERENCES public.countries(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_sponsored_by_company 
FOREIGN KEY (sponsored_by_company_id) REFERENCES public.companies(id);

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_current_nationality 
FOREIGN KEY (current_nationality_id) REFERENCES public.countries(id);