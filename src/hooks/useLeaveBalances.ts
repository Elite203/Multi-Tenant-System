import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

export const useLeaveBalances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaveBalances = async () => {
    if (!user?.id) return;
    
    try {
      // Get employee ID first
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (!employeeData) {
        setLeaveBalances([]);
        return;
      }

      // Fetch leave balances for current year
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('year', currentYear);

      if (error) throw error;
      setLeaveBalances(data || []);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      toast({
        title: "Error",
        description: "Failed to load leave balances",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveBalances();
  }, [user?.id]);

  return {
    leaveBalances,
    isLoading,
    refetch: fetchLeaveBalances,
  };
};