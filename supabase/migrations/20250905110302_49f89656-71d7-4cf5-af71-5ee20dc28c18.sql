-- Update employee_cos_documents table with new COS schema
-- Add new columns
ALTER TABLE public.employee_cos_documents 
ADD COLUMN certificate_number text,
ADD COLUMN assigned_date date,
ADD COLUMN certified_date date,
ADD COLUMN sponsor_name uuid REFERENCES public.companies(id),
ADD COLUMN sponsor_note text;

-- Rename existing columns
ALTER TABLE public.employee_cos_documents 
RENAME COLUMN sponsor_licence_number TO license_number;

ALTER TABLE public.employee_cos_documents 
RENAME COLUMN sponsorship_status TO cos_status;

-- Create enum type for COS status
CREATE TYPE public.cos_status_enum AS ENUM ('Active', 'Inactive', 'Expired', 'Archived');

-- Update cos_status column to use the new enum (after data migration)
-- First, update existing data to match new enum values
UPDATE public.employee_cos_documents 
SET cos_status = CASE 
  WHEN cos_status = 'active' THEN 'Active'
  WHEN cos_status = 'inactive' THEN 'Inactive'
  WHEN cos_status = 'expired' THEN 'Expired'
  WHEN cos_status = 'archived' THEN 'Archived'
  ELSE 'Active'
END;

-- Drop old column and recreate with enum type
ALTER TABLE public.employee_cos_documents 
DROP COLUMN cos_status;

ALTER TABLE public.employee_cos_documents 
ADD COLUMN cos_status public.cos_status_enum DEFAULT 'Active';