-- Create comprehensive settings tables for different categories

-- Notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  admin_email TEXT,
  cc_emails TEXT[] DEFAULT '{}',
  document_expiry_enabled BOOLEAN NOT NULL DEFAULT true,
  document_expiry_days INTEGER NOT NULL DEFAULT 30,
  leave_status_enabled BOOLEAN NOT NULL DEFAULT true,
  payslip_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  override_email TEXT, -- For dev mode
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security settings table
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_password_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_numbers BOOLEAN NOT NULL DEFAULT true,
  require_special_chars BOOLEAN NOT NULL DEFAULT false,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Branding settings table
CREATE TABLE public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_name TEXT NOT NULL DEFAULT 'HR Management System',
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3b82f6',
  secondary_color TEXT NOT NULL DEFAULT '#10b981',
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  currency TEXT NOT NULL DEFAULT 'GBP',
  language TEXT NOT NULL DEFAULT 'en-GB',
  fiscal_year_start DATE NOT NULL DEFAULT '2024-04-01',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  target_roles TEXT[] DEFAULT '{}',
  target_departments UUID[],
  target_companies UUID[],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled jobs table
CREATE TABLE public.scheduled_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  function_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  error_message TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_settings
CREATE POLICY "Admins and HR can manage notification settings" 
ON public.notification_settings FOR ALL 
USING (is_admin_or_hr(auth.uid()));

-- RLS policies for security_settings
CREATE POLICY "Only admins can manage security settings" 
ON public.security_settings FOR ALL 
USING (is_admin_only(auth.uid()));

-- RLS policies for branding_settings
CREATE POLICY "Admins and HR can manage branding settings" 
ON public.branding_settings FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view branding settings" 
ON public.branding_settings FOR SELECT 
USING (true);

-- RLS policies for announcements
CREATE POLICY "Admins and HR can manage announcements" 
ON public.announcements FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view published announcements" 
ON public.announcements FOR SELECT 
USING (status = 'published' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- RLS policies for scheduled_jobs
CREATE POLICY "Only admins can manage scheduled jobs" 
ON public.scheduled_jobs FOR ALL 
USING (is_admin_only(auth.uid()));

-- Insert default settings
INSERT INTO public.notification_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO public.security_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO public.branding_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert default scheduled jobs
INSERT INTO public.scheduled_jobs (name, description, cron_expression, function_name) VALUES 
('Cleanup Import Previews', 'Remove expired import preview data', '0 2 * * *', 'import-cleanup'),
('Update Rota Statuses', 'Update shift statuses based on date', '0 1 * * *', 'update-rota-statuses'),
('Sync Leave Balances', 'Synchronize employee leave balances', '0 3 1 * *', 'sync-leave-balances'),
('Send Reminder Notifications', 'Send document expiry and other reminders', '0 9 * * 1-5', 'send-reminders');

-- Add updated_at triggers
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_settings_updated_at
BEFORE UPDATE ON public.branding_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_jobs_updated_at
BEFORE UPDATE ON public.scheduled_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();