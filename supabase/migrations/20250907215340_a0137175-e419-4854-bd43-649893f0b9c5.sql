-- Create missing settings tables with proper structure and RLS policies

-- Security Settings Table
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_min_length INTEGER NOT NULL DEFAULT 8,
  password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
  password_require_lowercase BOOLEAN NOT NULL DEFAULT true,
  password_require_numbers BOOLEAN NOT NULL DEFAULT true,
  password_require_special_chars BOOLEAN NOT NULL DEFAULT true,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  enable_two_factor BOOLEAN NOT NULL DEFAULT false,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branding Settings Table  
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_name TEXT NOT NULL DEFAULT 'HR Management System',
  company_name TEXT NOT NULL DEFAULT 'Your Company',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3b82f6',
  secondary_color TEXT NOT NULL DEFAULT '#1e40af',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  language TEXT NOT NULL DEFAULT 'en',
  fiscal_year_start_date DATE NOT NULL DEFAULT '2024-04-01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification Settings Table (enhance existing or create if missing)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  admin_email TEXT,
  cc_emails TEXT[] NOT NULL DEFAULT '{}',
  document_expiry_notifications BOOLEAN NOT NULL DEFAULT true,
  document_expiry_days INTEGER NOT NULL DEFAULT 30,
  leave_status_notifications BOOLEAN NOT NULL DEFAULT true,
  payslip_notifications BOOLEAN NOT NULL DEFAULT true,
  development_mode BOOLEAN NOT NULL DEFAULT false,
  development_email_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  target_roles TEXT[] NOT NULL DEFAULT '{"employee"}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scheduled Jobs Table
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  function_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_settings (Admin only)
CREATE POLICY "Admin can manage security settings" ON public.security_settings
  FOR ALL USING (is_admin_only(auth.uid()));

-- Create RLS policies for branding_settings (Admin and HR)
CREATE POLICY "Admin and HR can manage branding settings" ON public.branding_settings
  FOR ALL USING (is_admin_or_hr(auth.uid()));

-- Create RLS policies for notification_settings (Admin and HR)
CREATE POLICY "Admin and HR can manage notification settings" ON public.notification_settings
  FOR ALL USING (is_admin_or_hr(auth.uid()));

-- Create RLS policies for announcements
CREATE POLICY "Admin and HR can manage announcements" ON public.announcements
  FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view published announcements" ON public.announcements
  FOR SELECT USING (status = 'published' AND 
    (start_date IS NULL OR start_date <= now()) AND 
    (end_date IS NULL OR end_date >= now()));

-- Create RLS policies for scheduled_jobs (Admin and HR)
CREATE POLICY "Admin and HR can manage scheduled jobs" ON public.scheduled_jobs
  FOR ALL USING (is_admin_or_hr(auth.uid()));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_security_settings
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_branding_settings
  BEFORE UPDATE ON public.branding_settings
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notification_settings
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_announcements
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_scheduled_jobs
  BEFORE UPDATE ON public.scheduled_jobs
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert default settings
INSERT INTO public.security_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO public.branding_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO public.notification_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert sample scheduled jobs
INSERT INTO public.scheduled_jobs (name, description, cron_expression, function_name) VALUES
  ('Email Notification Processor', 'Processes pending email notifications', '*/5 * * * *', 'send-email-notification'),
  ('Document Expiry Check', 'Checks for expiring documents and sends notifications', '0 9 * * *', 'check-document-expiry'),
  ('Payslip Status Update', 'Updates payslip statuses based on pay dates', '0 0 * * *', 'update-payslip-statuses'),
  ('Data Cleanup', 'Cleans up old temporary data and logs', '0 2 * * 0', 'data-cleanup')
ON CONFLICT DO NOTHING;