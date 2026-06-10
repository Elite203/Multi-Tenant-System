import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RotaStats {
  total_shifts: number;
  unique_employees: number;
  total_hours: number;
  confirmed_shifts: number;
}

export function useRotaStats(startDate: Date, endDate: Date) {
  const [stats, setStats] = useState<RotaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if the RPC function exists, if not calculate stats manually
      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_rota_statistics', {
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd')
          });

        if (rpcError) throw rpcError;
        setStats(data as unknown as RotaStats);
      } catch (rpcError) {
        // Fallback: calculate stats manually if RPC function isn't available
        
        const { data: shifts, error: shiftsError } = await supabase
          .from('rota_shifts')
          .select('employee_id, status, start_time, end_time, break_minutes')
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        if (shiftsError) throw shiftsError;

        if (shifts) {
          const uniqueEmployees = new Set(shifts.map(s => s.employee_id)).size;
          const confirmedShifts = shifts.filter(s => s.status === 'confirmed').length;
          const totalHours = shifts.reduce((total, shift) => {
            const start = new Date(`2000-01-01T${shift.start_time}`);
            const end = new Date(`2000-01-01T${shift.end_time}`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const breakHours = (shift.break_minutes || 0) / 60;
            return total + Math.max(0, hours - breakHours);
          }, 0);

          setStats({
            total_shifts: shifts.length,
            unique_employees: uniqueEmployees,
            total_hours: Math.round(totalHours),
            confirmed_shifts: confirmedShifts
          });
        } else {
          setStats({
            total_shifts: 0,
            unique_employees: 0,
            total_hours: 0,
            confirmed_shifts: 0
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching rota stats:', err);
      // Provide fallback stats
      setStats({
        total_shifts: 0,
        unique_employees: 0,
        total_hours: 0,
        confirmed_shifts: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate.getTime(), endDate.getTime()]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}