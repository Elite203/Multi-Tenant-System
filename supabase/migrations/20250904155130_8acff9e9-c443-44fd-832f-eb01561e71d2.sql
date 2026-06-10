-- Phase 2: Enhanced Employee Records - Update existing tables with new fields

-- Update employee_work_profiles table with missing fields
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS national_insurance_number text;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS soc_number text;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS work_email text;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS work_phone text;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS work_location text;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS weekly_working_hours numeric;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS sponsored_by_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.employee_work_profiles ADD COLUMN IF NOT EXISTS end_date date;

-- Update employee_rtw_documents table with new fields
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS rtw_reference text;
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS rtw_status text DEFAULT 'active';
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS share_code text;
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS current_active boolean DEFAULT true;
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS related_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employee_rtw_documents ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update employee_cos_documents table
ALTER TABLE public.employee_cos_documents RENAME COLUMN cos_reference_number TO certificate_number;
ALTER TABLE public.employee_cos_documents RENAME COLUMN sponsor_licence_number TO license_number;
ALTER TABLE public.employee_cos_documents ADD COLUMN IF NOT EXISTS assigned_date date;
ALTER TABLE public.employee_cos_documents ADD COLUMN IF NOT EXISTS certified_date date;
ALTER TABLE public.employee_cos_documents ADD COLUMN IF NOT EXISTS cos_status text DEFAULT 'active';
ALTER TABLE public.employee_cos_documents ADD COLUMN IF NOT EXISTS sponsor_name_company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.employee_cos_documents ADD COLUMN IF NOT EXISTS sponsor_note text;

-- Update employee_visas table
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS issuing_authority text;
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS issuing_country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.employee_visas ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update employee_passports table
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS place_of_birth text;
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS issuing_authority text;
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS issuing_country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.employee_passports ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update employee_bank_details table
ALTER TABLE public.employee_bank_details RENAME COLUMN is_primary TO primary_account;
ALTER TABLE public.employee_bank_details ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update emergency_contacts table - rename phone to primary_phone
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'phone') THEN
        ALTER TABLE public.emergency_contacts RENAME COLUMN phone TO primary_phone;
    END IF;
END $$;

-- Update employee_education table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_education' AND column_name = 'degree_type') THEN
        ALTER TABLE public.employee_education RENAME COLUMN degree_type TO degree;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_education' AND column_name = 'field_of_study') THEN
        ALTER TABLE public.employee_education RENAME COLUMN field_of_study TO major;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_education' AND column_name = 'institution_name') THEN
        ALTER TABLE public.employee_education RENAME COLUMN institution_name TO institution;
    END IF;
END $$;

ALTER TABLE public.employee_education ADD COLUMN IF NOT EXISTS year integer;

-- Update leave_requests table status values (create enum if needed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enhanced_leave_status') THEN
        CREATE TYPE enhanced_leave_status AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'availed');
    END IF;
END $$;

-- Migrate existing leave data to include issuing_country as foreign key
UPDATE public.employee_passports SET issuing_country_id = (
    SELECT id FROM public.countries WHERE LOWER(name) = LOWER(issuing_country) LIMIT 1
) WHERE issuing_country IS NOT NULL AND issuing_country_id IS NULL;

UPDATE public.employee_visas SET issuing_country_id = (
    SELECT id FROM public.countries WHERE LOWER(name) = LOWER(issuing_country) LIMIT 1
) WHERE issuing_country IS NOT NULL AND issuing_country_id IS NULL;

-- Extract year from graduation_date for education records
UPDATE public.employee_education SET year = EXTRACT(YEAR FROM graduation_date) 
WHERE graduation_date IS NOT NULL AND year IS NULL;

-- Function to ensure only one primary bank account per employee
CREATE OR REPLACE FUNCTION enforce_single_primary_bank_account()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.primary_account = true THEN
        -- Set all other accounts for this employee to non-primary
        UPDATE public.employee_bank_details 
        SET primary_account = false 
        WHERE employee_id = NEW.employee_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary bank account enforcement
DROP TRIGGER IF EXISTS trigger_enforce_single_primary_bank_account ON public.employee_bank_details;
CREATE TRIGGER trigger_enforce_single_primary_bank_account
    BEFORE INSERT OR UPDATE ON public.employee_bank_details
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_primary_bank_account();

-- Update current employee count for all companies
UPDATE public.companies SET employee_count = (
    SELECT COUNT(*) 
    FROM public.employees 
    WHERE company_id = companies.id AND status = 'active'
);