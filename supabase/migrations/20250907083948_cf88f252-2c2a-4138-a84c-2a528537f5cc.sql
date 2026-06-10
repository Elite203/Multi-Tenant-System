-- Fix security issues and continue with document system

-- Create a simple hash function for document fingerprinting
CREATE OR REPLACE FUNCTION public.generate_document_hash(content_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(content_text);
$$;