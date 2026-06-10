import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityItem {
  id: string;
  type: string;
  user_name: string;
  action: string;
  time: string;
  status?: string;
  table_name?: string;
}

export const useDashboardActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Get recent activities from audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          table_name,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditError) throw auditError;

      // Get user information for the activities
      const userIds = [...new Set(auditLogs?.map(log => log.user_id).filter(Boolean) || [])];
      
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (employeesError) throw employeesError;

      // Map activities with user names
      const activitiesWithUsers = auditLogs?.map(log => {
        const employee = employees?.find(emp => emp.user_id === log.user_id);
        const userName = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown User';
        
        return {
          id: log.id,
          type: log.action,
          user_name: userName,
          action: formatAction(log.action, log.table_name),
          time: formatTime(log.created_at),
          table_name: log.table_name,
        };
      }) || [];

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Error fetching dashboard activities:', error);
      toast({
        title: "Error",
        description: "Failed to load recent activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string, tableName?: string) => {
    const actionMap: Record<string, string> = {
      INSERT: 'created',
      UPDATE: 'updated',
      DELETE: 'deleted',
    };

    const tableMap: Record<string, string> = {
      employees: 'employee record',
      leave_requests: 'leave request',
      documents: 'document',
      timesheets: 'timesheet',
    };

    const actionText = actionMap[action] || action.toLowerCase();
    const tableText = tableMap[tableName || ''] || tableName || 'record';

    return `${actionText} ${tableText}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, loading, refetch: fetchActivities };
};