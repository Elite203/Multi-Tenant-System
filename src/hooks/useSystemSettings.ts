import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Simple interface without complex types
interface SettingData {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, SettingData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Use raw query to avoid TypeScript inference issues
      const { data, error }: { data: any[] | null; error: any } = await supabase
        .from('system_settings')
        .select('id, setting_key, setting_value, description, is_active, created_at, updated_at')
        .eq('is_active', true);

      if (error) {
        console.warn('System settings table not available, using defaults:', error);
        setSettings({
          rota_module_enabled: {
            id: 'default-1',
            setting_key: 'rota_module_enabled',
            setting_value: { value: true },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: 'Enable ROTA module',
          },
          default_shift_duration: {
            id: 'default-2',
            setting_key: 'default_shift_duration',
            setting_value: { value: 8 },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: 'Default shift duration',
          },
        });
        return;
      }

      // Manually build settings map
      const settingsMap: Record<string, SettingData> = {};
      
      if (data && Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item && item.setting_key) {
            settingsMap[item.setting_key] = {
              id: item.id || '',
              setting_key: item.setting_key,
              setting_value: item.setting_value || {},
              description: item.description || '',
              is_active: Boolean(item.is_active),
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            };
          }
        });
      }

      setSettings(settingsMap);
    } catch (err) {
      console.error('Error fetching system settings:', err);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSetting = (key: string) => {
    return settings[key];
  };

  const updateSetting = async (key: string, value: any, description?: string) => {
    try {
      setIsUpdating(true);

      const { data, error }: { data: any; error: any } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description || '',
          is_active: true,
        })
        .select('id, setting_key, setting_value, description, is_active, created_at, updated_at')
        .single();

      if (error) throw error;

      if (data) {
        const newSetting: SettingData = {
          id: data.id || '',
          setting_key: data.setting_key,
          setting_value: data.setting_value || {},
          description: data.description || '',
          is_active: Boolean(data.is_active),
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };

        setSettings(prev => ({
          ...prev,
          [key]: newSetting,
        }));
      }

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    } catch (err) {
      console.error('Error updating setting:', err);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const createDefaultSettings = async () => {
    const defaultSettings = [
      {
        setting_key: 'rota_module_enabled',
        setting_value: { value: true },
        description: 'Enable/disable ROTA scheduling module',
        is_active: true,
      },
      {
        setting_key: 'default_shift_duration',
        setting_value: { value: 8 },
        description: 'Default shift duration in hours',
        is_active: true,
      },
      {
        setting_key: 'max_parent_companies',
        setting_value: { value: 5 },
        description: 'Maximum number of parent companies allowed',
        is_active: true,
      },
      {
        setting_key: 'max_child_companies',
        setting_value: { value: 50 },
        description: 'Maximum number of child companies per parent',
        is_active: true,
      },
      {
        setting_key: 'default_leave_allocation',
        setting_value: { value: 25 },
        description: 'Default annual leave allocation in days',
        is_active: true,
      },
    ];

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(defaultSettings);

      if (error) throw error;

      await fetchSettings();
      
      toast({
        title: "Success",
        description: "Default settings created successfully",
      });
    } catch (err) {
      console.error('Error creating default settings:', err);
      toast({
        title: "Error",
        description: "Failed to create default settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUpdating,
    getSetting,
    updateSetting,
    createDefaultSettings,
    refetch: fetchSettings,
  };
};