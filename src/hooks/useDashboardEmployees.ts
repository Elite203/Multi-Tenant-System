import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employee_number: string;
  status: string;
  job_title_name?: string;
  department_name?: string;
  hire_date: string;
}

export const useDashboardEmployees = () => {
  const client = useSupabaseClient();
  const [employees, setEmployees] = useState<DashboardEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const { data, error } = await client
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          employee_number,
          status,
          hire_date,
          job_titles!fk_employees_job_title (
            title
          ),
          departments!fk_employees_department (
            name
          )
        `)
        .eq('status', 'active')
        .order('hire_date', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Transform the data to match the interface
      const transformedData = data?.map((emp: any) => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        employee_number: emp.employee_number,
        status: emp.status,
        hire_date: emp.hire_date,
        job_title_name: emp.job_titles?.title,
        department_name: emp.departments?.name,
      })) || [];

      setEmployees(transformedData);
    } catch (error) {
      console.error('Error fetching dashboard employees:', error);
      toast({
        title: "Error",
        description: "Failed to load recent employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return { employees, loading, refetch: fetchEmployees };
};