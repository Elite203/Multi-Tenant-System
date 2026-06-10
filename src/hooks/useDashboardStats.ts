import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  documentsExpiring: number;
  timesheetsPending: number;
  totalDepartments: number;
  complianceScore: number;
  employeeGrowth: number;
}

export const useDashboardStats = () => {
  const client = useSupabaseClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    documentsExpiring: 0,
    timesheetsPending: 0,
    totalDepartments: 0,
    complianceScore: 0,
    employeeGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch employee stats
      const { data: employees, error: employeesError } = await client
        .from('employees')
        .select('status, created_at')
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.status === 'active')?.length || 0;

      // Calculate employee growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentHires = employees?.filter(emp => 
        new Date(emp.created_at) >= thirtyDaysAgo
      )?.length || 0;
      const employeeGrowth = totalEmployees > 0 ? (recentHires / totalEmployees) * 100 : 0;

      // Fetch leave requests
      const { data: leaveRequests, error: leaveError } = await client
        .from('leave_requests')
        .select('status')
        .eq('status', 'pending');

      if (leaveError) throw leaveError;

      // Fetch expiring documents
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data: documents, error: documentsError } = await client
        .from('documents')
        .select('expiry_date')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', futureDate.toISOString().split('T')[0]);

      if (documentsError) throw documentsError;

      // Fetch timesheets (assuming pending status)
      const { data: timesheets, error: timesheetsError } = await client
        .from('timesheets')
        .select('status')
        .eq('status', 'pending');

      if (timesheetsError) throw timesheetsError;

      // Fetch departments
      const { data: departments, error: departmentsError } = await client
        .from('departments')
        .select('id')
        .eq('is_active', true);

      if (departmentsError) throw departmentsError;

      // Calculate compliance score (average of all employees)
      const { data: employeeCompliance, error: complianceError } = await client
        .from('employees')
        .select('compliance_score')
        .not('compliance_score', 'is', null);

      if (complianceError) throw complianceError;

      const avgCompliance = employeeCompliance?.length > 0 
        ? employeeCompliance.reduce((sum, emp) => sum + (emp.compliance_score || 0), 0) / employeeCompliance.length
        : 0;

      setStats({
        totalEmployees,
        activeEmployees,
        pendingLeaveRequests: leaveRequests?.length || 0,
        documentsExpiring: documents?.length || 0,
        timesheetsPending: timesheets?.length || 0,
        totalDepartments: departments?.length || 0,
        complianceScore: Math.round(avgCompliance),
        employeeGrowth: Math.round(employeeGrowth * 100) / 100,
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
};