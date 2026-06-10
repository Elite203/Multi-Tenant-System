-- Fix the remaining function
CREATE OR REPLACE FUNCTION public.generate_document_hash(file_content bytea)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT encode(digest(file_content, 'sha256'), 'hex');
$function$;

-- Create a secure view replacement function instead of the document_statistics view
DROP VIEW IF EXISTS public.document_statistics;

CREATE OR REPLACE FUNCTION public.get_document_statistics()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'total_documents', count(*),
    'employee_documents', count(*) FILTER (WHERE employee_id IS NOT NULL),
    'company_documents', count(*) FILTER (WHERE company_id IS NOT NULL),
    'total_size_mb', COALESCE(sum(size_mb), 0::numeric),
    'expired_documents', count(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE),
    'expiring_soon_documents', count(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= (CURRENT_DATE + interval '30 days'))
  )
  FROM public.documents
  WHERE is_active = true
    AND (
      -- User can see their own documents
      employee_id = get_employee_id(auth.uid()) OR
      -- Admins/HR can see all documents
      is_admin_or_hr(auth.uid()) OR
      -- Company documents are viewable by authenticated users
      (company_id IS NOT NULL AND auth.uid() IS NOT NULL)
    );
$function$;