-- Add missing columns to notification_settings table to match our interface
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS cc_emails TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS document_expiry_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_expiry_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS leave_status_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payslip_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS development_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS development_email_override TEXT;

-- Rename email_enabled to email_notifications_enabled for consistency
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'email_enabled') THEN
        ALTER TABLE public.notification_settings RENAME COLUMN email_enabled TO email_notifications_enabled;
    END IF;
END $$;

-- Insert default settings if none exist
INSERT INTO public.notification_settings (
  email_notifications_enabled, 
  admin_email, 
  cc_emails, 
  document_expiry_notifications, 
  document_expiry_days, 
  leave_status_notifications, 
  payslip_notifications, 
  development_mode
) 
SELECT true, null, '{}', true, 30, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.notification_settings);