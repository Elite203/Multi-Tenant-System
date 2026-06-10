-- Fix security issues from the document statistics view

-- Drop the problematic view and recreate as a regular view
DROP VIEW IF EXISTS public.document_statistics;

-- Create the document statistics view without SECURITY DEFINER
CREATE VIEW public.document_statistics AS
SELECT 
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL) as employee_documents,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as company_documents,
  COALESCE(SUM(size_mb), 0) as total_size_mb,
  COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE) as expired_documents,
  COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon_documents
FROM public.documents 
WHERE is_active = true;

-- Fix the document hash function to have proper search path
CREATE OR REPLACE FUNCTION public.generate_document_hash(file_content bytea)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(digest(file_content, 'sha256'), 'hex');
$$;