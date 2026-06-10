import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TimesheetEntry {
  id: string;
  employee_id: string;
  profile_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  break_minutes: number;
  hours: number;
  overtime_hours: number;
  description: string;
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  week_ending?: string;
  shift_id?: string;
  manager_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TimesheetStats {
  total_hours: number;
  total_overtime: number;
  total_entries: number;
  approved_entries: number;
  pending_entries: number;
  rejected_entries: number;
  weekly_target: number;
  avg_daily_hours: number;
}

export interface TimesheetFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  search?: string;
}

export const useTimesheets = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [stats, setStats] = useState<TimesheetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async (filters: TimesheetFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('timesheet_entries')
        .select('*')
        .order('date', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data || []) as TimesheetEntry[]);
    } catch (err) {
      console.error('Error fetching timesheet entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (employeeId?: string, startDate?: string, endDate?: string) => {
    try {
      // First check if the RPC function exists, if not calculate stats manually
      const { data, error } = await supabase.rpc('get_timesheet_statistics', {
        target_employee_id: employeeId,
        start_date: startDate,
        end_date: endDate
      });

      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        // Fallback to manual calculation
        await calculateStatsManually(employeeId, startDate, endDate);
        return;
      }

      if (error) throw error;
      setStats(data as unknown as TimesheetStats);
    } catch (err) {
      console.error('Error fetching timesheet stats:', err);
      // Fallback to manual calculation
      await calculateStatsManually(employeeId, startDate, endDate);
    }
  };

  const calculateStatsManually = async (employeeId?: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase.from('timesheet_entries').select('*');
      
      if (employeeId) query = query.eq('employee_id', employeeId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data: entries, error } = await query;
      if (error) throw error;

      const stats: TimesheetStats = {
        total_hours: entries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0,
        total_overtime: entries?.reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0) || 0,
        total_entries: entries?.length || 0,
        approved_entries: entries?.filter(e => e.status === 'approved').length || 0,
        pending_entries: entries?.filter(e => e.status === 'draft' || e.status === 'submitted').length || 0,
        rejected_entries: entries?.filter(e => e.status === 'rejected').length || 0,
        weekly_target: 40.0,
        avg_daily_hours: entries?.length ? (entries.reduce((sum, entry) => sum + (entry.hours || 0), 0) / entries.length) : 0
      };

      setStats(stats);
    } catch (err) {
      console.error('Error calculating stats manually:', err);
    }
  };

  const createEntry = async (entryData: Partial<TimesheetEntry>) => {
    try {
      // Prepare data without profile_id for the database insert
      const { profile_id, ...insertData } = entryData;
      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert({
          ...insertData,
          employee_id: insertData.employee_id || '', // Ensure required fields
          date: insertData.date || '',
          description: insertData.description || '',
          hours: insertData.hours || 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet entry created successfully",
      });

      return data;
    } catch (err) {
      console.error('Error creating timesheet entry:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create entry',
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<TimesheetEntry>) => {
    try {
      const { data, error } = await supabase
        .from('timesheet_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet entry updated successfully",
      });

      return data;
    } catch (err) {
      console.error('Error updating timesheet entry:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update entry',
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timesheet_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet entry deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting timesheet entry:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete entry',
        variant: "destructive",
      });
      throw err;
    }
  };

  const approveEntry = async (id: string) => {
    return updateEntry(id, { 
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    });
  };

  const rejectEntry = async (id: string, reason?: string) => {
    return updateEntry(id, { 
      status: 'rejected',
      rejected_by: user?.id,
      rejected_at: new Date().toISOString(),
      notes: reason
    });
  };

  const submitEntry = async (id: string) => {
    return updateEntry(id, { status: 'submitted' });
  };

  const importFromRota = async (employeeId: string, weekStart: string) => {
    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc('import_rota_to_timesheet', {
        target_employee_id: employeeId,
        target_week_start: weekStart
      });

      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        // Fallback to manual import
        return await importFromRotaManually(employeeId, weekStart);
      }

      if (error) throw error;

      const importedCount = data?.filter((item: any) => item.status === 'imported').length || 0;
      const existingCount = data?.filter((item: any) => item.status === 'already_exists').length || 0;

      toast({
        title: "ROTA Import Complete",
        description: `Imported ${importedCount} new entries. ${existingCount} entries already existed.`,
      });

      return data;
    } catch (err) {
      console.error('Error importing from ROTA:', err);
      toast({
        title: "Import Error",
        description: err instanceof Error ? err.message : 'Failed to import from ROTA',
        variant: "destructive",
      });
      throw err;
    }
  };

  const importFromRotaManually = async (employeeId: string, weekStart: string) => {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Fetch completed ROTA shifts for the week
      const { data: shifts, error } = await supabase
        .from('rota_shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'completed')
        .gte('date', weekStart)
        .lte('date', weekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const results = [];
      for (const shift of shifts || []) {
        const hours = calculateHours(shift.start_time, shift.end_time, shift.break_minutes || 0);
        
        try {
          const { data: existingEntry } = await supabase
            .from('timesheet_entries')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('date', shift.date)
            .single();

          if (existingEntry) {
            results.push({ shift_date: shift.date, status: 'already_exists' });
            continue;
          }

          const { data: newEntry, error: insertError } = await supabase
            .from('timesheet_entries')
            .insert({
              employee_id: employeeId,
              date: shift.date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              break_minutes: shift.break_minutes || 0,
              hours: hours,
              description: 'Imported from ROTA',
              status: 'draft',
              shift_id: shift.id,
              week_ending: weekStart
            })
            .select()
            .single();

          if (insertError) throw insertError;

          results.push({ 
            timesheet_id: newEntry.id, 
            shift_date: shift.date, 
            hours_imported: hours, 
            status: 'imported' 
          });
        } catch (err) {
          console.error('Error importing shift:', err);
          results.push({ shift_date: shift.date, status: 'error' });
        }
      }

      const importedCount = results.filter(r => r.status === 'imported').length;
      const existingCount = results.filter(r => r.status === 'already_exists').length;

      toast({
        title: "ROTA Import Complete",
        description: `Imported ${importedCount} new entries. ${existingCount} entries already existed.`,
      });

      return results;
    } catch (err) {
      console.error('Error in manual ROTA import:', err);
      throw err;
    }
  };

  const calculateHours = (startTime: string, endTime: string, breakMinutes: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round((diffHours - (breakMinutes / 60)) * 100) / 100;
  };

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, []);

  return {
    entries,
    stats,
    loading,
    error,
    fetchEntries,
    fetchStats,
    createEntry,
    updateEntry,
    deleteEntry,
    approveEntry,
    rejectEntry,
    submitEntry,
    importFromRota,
    refetch: () => {
      fetchEntries();
      fetchStats();
    }
  };
};