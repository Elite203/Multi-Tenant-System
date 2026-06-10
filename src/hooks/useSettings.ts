import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  id?: string;
  email_notifications_enabled: boolean;
  admin_email?: string;
  cc_emails: string[];
  document_expiry_enabled: boolean;
  document_expiry_days: number;
  leave_status_enabled: boolean;
  payslip_notifications_enabled: boolean;
  override_email?: string;
}

interface SecuritySettings {
  id?: string;
  min_password_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  two_factor_enabled: boolean;
}

interface BrandingSettings {
  id?: string;
  application_name: string;
  company_name?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  currency: string;
  language: string;
  fiscal_year_start: string;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications_enabled: true,
    cc_emails: [],
    document_expiry_enabled: true,
    document_expiry_days: 30,
    leave_status_enabled: true,
    payslip_notifications_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const settings_data = data as any;
        setSettings({
          id: settings_data.id,
          email_notifications_enabled: settings_data.email_notifications_enabled ?? true,
          admin_email: settings_data.admin_email,
          cc_emails: settings_data.cc_emails || [],
          document_expiry_enabled: settings_data.document_expiry_notifications ?? true,
          document_expiry_days: settings_data.document_expiry_days ?? 30,
          leave_status_enabled: settings_data.leave_status_notifications ?? true,
          payslip_notifications_enabled: settings_data.payslip_notifications ?? true,
          override_email: settings_data.development_email_override,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsUpdating(true);
    try {
      const updateData = {
        email_notifications_enabled: newSettings.email_notifications_enabled ?? settings.email_notifications_enabled,
        admin_email: newSettings.admin_email ?? settings.admin_email,
        cc_emails: newSettings.cc_emails ?? settings.cc_emails,
        document_expiry_notifications: newSettings.document_expiry_enabled ?? settings.document_expiry_enabled,
        document_expiry_days: newSettings.document_expiry_days ?? settings.document_expiry_days,
        leave_status_notifications: newSettings.leave_status_enabled ?? settings.leave_status_enabled,
        payslip_notifications: newSettings.payslip_notifications_enabled ?? settings.payslip_notifications_enabled,
        development_email_override: newSettings.override_email ?? settings.override_email,
      };

      const { error } = await supabase
        .from('notification_settings')
        .update(updateData as any)
        .eq('id', settings.id);

      if (error) throw error;

      // Update local state
      setSettings({ ...settings, ...newSettings });
      
      toast({
        title: "Settings Updated",
        description: "Notification settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    updateSettings,
    refetch: fetchSettings,
  };
};

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    min_password_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: false,
    session_timeout_minutes: 480,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    two_factor_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          min_password_length: data.password_min_length,
          require_uppercase: data.password_require_uppercase,
          require_lowercase: data.password_require_lowercase,
          require_numbers: data.password_require_numbers,
          require_special_chars: data.password_require_special_chars,
          session_timeout_minutes: data.session_timeout_minutes,
          max_login_attempts: data.max_login_attempts,
          lockout_duration_minutes: data.lockout_duration_minutes,
          two_factor_enabled: data.enable_two_factor,
        });
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SecuritySettings>) => {
    setIsUpdating(true);
    try {
      const updateData = {
        password_min_length: newSettings.min_password_length ?? settings.min_password_length,
        password_require_uppercase: newSettings.require_uppercase ?? settings.require_uppercase,
        password_require_lowercase: newSettings.require_lowercase ?? settings.require_lowercase,
        password_require_numbers: newSettings.require_numbers ?? settings.require_numbers,
        password_require_special_chars: newSettings.require_special_chars ?? settings.require_special_chars,
        session_timeout_minutes: newSettings.session_timeout_minutes ?? settings.session_timeout_minutes,
        max_login_attempts: newSettings.max_login_attempts ?? settings.max_login_attempts,
        lockout_duration_minutes: newSettings.lockout_duration_minutes ?? settings.lockout_duration_minutes,
        enable_two_factor: newSettings.two_factor_enabled ?? settings.two_factor_enabled,
      };

      const { data, error } = await supabase
        .from('security_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSettings({ ...settings, ...newSettings });
      
      toast({
        title: "Settings Updated",
        description: "Security settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    updateSettings,
    refetch: fetchSettings,
  };
};

export const useBrandingSettings = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    application_name: 'HR Management System',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    timezone: 'Europe/London',
    currency: 'GBP',
    language: 'en-GB',
    fiscal_year_start: '2024-04-01',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          application_name: data.application_name,
          company_name: data.company_name,
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          timezone: data.timezone,
          currency: data.currency,
          language: data.language,
          fiscal_year_start: data.fiscal_year_start_date,
        });
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BrandingSettings>) => {
    setIsUpdating(true);
    try {
      const updateData = {
        application_name: newSettings.application_name ?? settings.application_name,
        company_name: newSettings.company_name ?? settings.company_name,
        logo_url: newSettings.logo_url ?? settings.logo_url,
        favicon_url: newSettings.favicon_url ?? settings.favicon_url,
        primary_color: newSettings.primary_color ?? settings.primary_color,
        secondary_color: newSettings.secondary_color ?? settings.secondary_color,
        timezone: newSettings.timezone ?? settings.timezone,
        currency: newSettings.currency ?? settings.currency,
        language: newSettings.language ?? settings.language,
        fiscal_year_start_date: newSettings.fiscal_year_start ?? settings.fiscal_year_start,
      };

      const { data, error } = await supabase
        .from('branding_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSettings({ ...settings, ...newSettings });
      
      toast({
        title: "Settings Updated",
        description: "Branding settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to update branding settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    updateSettings,
    refetch: fetchSettings,
  };
};