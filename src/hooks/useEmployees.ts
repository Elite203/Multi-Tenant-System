import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  employee_type: string;
  department_name?: string;
  job_title_name?: string;
  company_name?: string;
  manager_name?: string;
  profile_photo?: string;
  hire_date?: string;
  salary?: number;
  immigration_status?: string;
  compliance_score?: number;
}

export interface EmployeeFilters {
  status?: string;
  department?: string;
  employee_type?: string;
  search?: string;
}

export const useEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (filters: EmployeeFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // First get basic employee data
      let query = supabase
        .from('employees')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          email,
          phone,
          street_address,
          address_line_2,
          city,
          state_province,
          postal_code,
          country_id,
          status,
          employee_type,
          profile_photo,
          hire_date,
          salary,
          immigration_status,
          compliance_score,
          department,
          job_title,
          company_id,
          manager_id
        `)
        .order('first_name', { ascending: true });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.employee_type) {
        query = query.eq('employee_type', filters.employee_type as any);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get related data separately to avoid join issues
      const departmentIds = [...new Set(data?.map(emp => emp.department).filter(Boolean))];
      const jobTitleIds = [...new Set(data?.map(emp => emp.job_title).filter(Boolean))];
      const companyIds = [...new Set(data?.map(emp => emp.company_id).filter(Boolean))];
      const managerIds = [...new Set(data?.map(emp => emp.manager_id).filter(Boolean))];

      const [departments, jobTitles, companies, managers] = await Promise.all([
        departmentIds.length > 0 ? supabase.from('departments').select('id, name').in('id', departmentIds) : { data: [] },
        jobTitleIds.length > 0 ? supabase.from('job_titles').select('id, title').in('id', jobTitleIds) : { data: [] },
        companyIds.length > 0 ? supabase.from('companies').select('id, name').in('id', companyIds) : { data: [] },
        managerIds.length > 0 ? supabase.from('employees').select('id, first_name, last_name').in('id', managerIds) : { data: [] }
      ]);

      // Create lookup maps
      const departmentMap = new Map((departments.data || []).map(d => [d.id, d.name]));
      const jobTitleMap = new Map((jobTitles.data || []).map(j => [j.id, j.title]));
      const companyMap = new Map((companies.data || []).map(c => [c.id, c.name]));
      const managerMap = new Map((managers.data || []).map(m => [m.id, `${m.first_name} ${m.last_name}`]));

      // Transform the data
      const transformedEmployees = data?.map((emp: any) => ({
        id: emp.id,
        employee_number: emp.employee_number,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        address: emp.address,
        status: emp.status,
        employee_type: emp.employee_type,
        profile_photo: emp.profile_photo,
        hire_date: emp.hire_date,
        salary: emp.salary,
        immigration_status: emp.immigration_status,
        compliance_score: emp.compliance_score,
        department_name: departmentMap.get(emp.department) as string,
        job_title_name: jobTitleMap.get(emp.job_title) as string,
        company_name: companyMap.get(emp.company_id) as string,
        manager_name: managerMap.get(emp.manager_id) as string,
      })) || [];

      setEmployees(transformedEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployee = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get related data
      const [departmentData, jobTitleData, companyData, managerData] = await Promise.all([
        data.department ? supabase.from('departments').select('name').eq('id', data.department).single() : { data: null },
        data.job_title ? supabase.from('job_titles').select('title').eq('id', data.job_title).single() : { data: null },
        data.company_id ? supabase.from('companies').select('name').eq('id', data.company_id).single() : { data: null },
        data.manager_id ? supabase.from('employees').select('first_name, last_name').eq('id', data.manager_id).single() : { data: null }
      ]);

      return {
        ...data,
        department_name: departmentData.data?.name,
        job_title_name: jobTitleData.data?.title,
        company_name: companyData.data?.name,
        manager_name: managerData.data 
          ? `${managerData.data.first_name} ${managerData.data.last_name}`
          : undefined,
      };
    } catch (err) {
      console.error('Error fetching employee:', err);
      throw err;
    }
  };

  const createEmployee = async (employeeData: any) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee created successfully",
      });

      return data;
    } catch (err) {
      console.error('Error creating employee:', err);
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEmployee = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      return data;
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_organization_statistics');
      
      if (error) {
        // Fallback to manual calculation
        const { data: employeeData } = await supabase
          .from('employees')
          .select('status, department, manager_id')
          .eq('status', 'active');

        return {
          total_employees: employeeData?.length || 0,
          total_departments: new Set(employeeData?.map(e => e.department).filter(Boolean)).size || 0,
          hierarchy_levels: 3, // Default fallback
          managers_count: new Set(employeeData?.map(e => e.manager_id).filter(Boolean)).size || 0,
          top_level_employees: employeeData?.filter(e => !e.manager_id).length || 0,
        };
      }

      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return {
        total_employees: 0,
        total_departments: 0,
        hierarchy_levels: 0,
        managers_count: 0,
        top_level_employees: 0,
      };
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    isLoading,
    error,
    fetchEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getStats,
    refetch: () => fetchEmployees(),
  };
};