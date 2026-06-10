-- Fix Security Definer Functions - Set Proper Search Path
-- This addresses the "Function Search Path Mutable" warnings

-- Update existing functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.is_admin_or_hr(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.employees WHERE user_id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_only(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.can_archive_records(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role IN ('admin', 'hr') FROM public.profiles WHERE id = user_uuid;
$function$;

-- Fix RLS Policies for Sensitive Data
-- Remove public access to companies table
DROP POLICY IF EXISTS "Everyone can view companies" ON public.companies;

-- Create proper company access policy
CREATE POLICY "Authenticated users can view companies" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (true);

-- Fix document access - remove public company document access
DROP POLICY IF EXISTS "Everyone can view company documents" ON public.documents;

-- Create proper document access policy for company documents
CREATE POLICY "Authenticated users can view company documents" 
ON public.documents 
FOR SELECT 
TO authenticated 
USING (company_id IS NOT NULL);

-- Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource text NOT NULL,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
TO authenticated 
USING (is_admin_only(auth.uid()));

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    resource,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;