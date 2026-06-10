import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'document_expiry' | 'timesheet_reminder' | 'payslip_available' | 'employee_update' | 'system_alert';
  title: string;
  message: string;
  metadata: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications_enabled: boolean;
  email_types: any;
  in_app_enabled: boolean;
  reminder_days: number[];
  admin_email?: string;
  cc_emails: string[];
  document_expiry_notifications: boolean;
  document_expiry_days: number;
  leave_status_notifications: boolean;
  payslip_notifications: boolean;
  development_mode: boolean;
  development_email_override?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  loading: boolean;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    }
  }, [user]);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data as NotificationSettings);
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: user.id,
          email_notifications_enabled: true,
          email_types: {
            leave_request: true,
            leave_approved: true,
            leave_rejected: true,
            document_expiry: true,
            timesheet_reminder: true,
            payslip_available: true,
            employee_update: true,
            system_alert: true,
          },
          in_app_enabled: true,
          reminder_days: [90, 60, 30, 7],
          admin_email: null,
          cc_emails: [],
          document_expiry_notifications: true,
          document_expiry_days: 30,
          leave_status_notifications: true,
          payslip_notifications: true,
          development_mode: false,
          development_email_override: null,
        };

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as NotificationSettings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, [user]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Remove notification
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read_at);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error removing notification:', error);
      toast({
        title: "Error",
        description: "Failed to remove notification",
        variant: "destructive",
      });
    }
  }, [user, notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    }
  }, [user]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(newSettings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data as NotificationSettings);
      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  }, [settings]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  }, [fetchNotifications]);

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchSettings()]).finally(() => {
        setLoading(false);
      });
    } else {
      setNotifications([]);
      setSettings(null);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, fetchNotifications, fetchSettings]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
            if (!newNotification.read_at) {
              setUnreadCount(prev => prev + 1);
            }
            
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};