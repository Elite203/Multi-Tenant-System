-- Enhanced Document Management System Database Schema
-- Extend the existing documents table with enterprise features

-- Add new columns to the documents table for enhanced functionality
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS size_mb numeric;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_processed boolean DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS extraction_method text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS type_confidence numeric;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_hash text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_category text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_type text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_profile_id ON public.documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON public.documents(document_hash);
CREATE INDEX IF NOT EXISTS idx_documents_ai_processed ON public.documents(ai_processed);

-- Update size_mb from existing file_size if it exists
UPDATE public.documents 
SET size_mb = CASE 
  WHEN file_size IS NOT NULL THEN file_size / (1024.0 * 1024.0)
  ELSE NULL 
END
WHERE size_mb IS NULL AND file_size IS NOT NULL;

-- Add RLS policies for company documents
CREATE POLICY "Admins and HR can manage company documents" 
ON public.documents 
FOR ALL 
USING (is_admin_or_hr(auth.uid()) AND company_id IS NOT NULL);

CREATE POLICY "Everyone can view company documents" 
ON public.documents 
FOR SELECT 
USING (company_id IS NOT NULL);

-- Create a function to generate document hash
CREATE OR REPLACE FUNCTION public.generate_document_hash(file_content bytea)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(file_content, 'sha256'), 'hex');
$$;

-- Create document statistics view
CREATE OR REPLACE VIEW public.document_statistics AS
SELECT 
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL) as employee_documents,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as company_documents,
  COALESCE(SUM(size_mb), 0) as total_size_mb,
  COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE) as expired_documents,
  COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon_documents
FROM public.documents 
WHERE is_active = true;