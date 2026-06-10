import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Employee, 
  EmployeeFilters, 
  EmployeeSortOptions, 
  PaginationOptions,
  EmployeeListResponse,
  EmployeeDetailResponse 
} from '@/types/employee';

interface UseEmployeeQueryOptions {
  enablePagination?: boolean;
  defaultPageSize?: number;
}

export function useEmployeeQuery(options: UseEmployeeQueryOptions = {}) {
  const { enablePagination = false, defaultPageSize = 50 } = options;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback((
    filters: EmployeeFilters,
    sort: EmployeeSortOptions,
    pagination?: PaginationOptions
  ) => {
    let query = supabase
      .from('employees')
      .select(`
        *,
        companies!fk_employees_company(id, name),
        job_titles!fk_employees_job_title(id, title),
        departments!fk_employees_department(id, name),
        current_nationality:countries!fk_employees_current_nationality(id, name),
        sponsored_by_company:companies!fk_employees_sponsored_by_company(id, name),
        manager:employees!fk_employees_manager(id, first_name, last_name, employee_number)
      `);
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.department && filters.department !== 'all') {
      query = query.eq('department', filters.department);
    }

    if (filters.employee_type && filters.employee_type !== 'all') {
      query = query.eq('employee_type', filters.employee_type);
    }

    if (filters.manager_id) {
      query = query.eq('manager_id', filters.manager_id);
    }

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    if (filters.immigration_status && filters.immigration_status !== 'all') {
      query = query.eq('immigration_status', filters.immigration_status);
    }

    if (!filters.show_archived) {
      query = query.is('archived_at', null);
    }

    // Apply search
    if (filters.search) {
      query = query.or(`
        first_name.ilike.%${filters.search}%,
        last_name.ilike.%${filters.search}%,
        employee_number.ilike.%${filters.search}%,
        email.ilike.%${filters.search}%
      `);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    if (enablePagination && pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    return query;
  }, [enablePagination]);

  const fetchEmployees = useCallback(async (
    filters: EmployeeFilters = {},
    sort: EmployeeSortOptions = { field: 'first_name', direction: 'asc' },
    pagination?: PaginationOptions
  ): Promise<EmployeeListResponse | Employee[]> => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery(filters, sort, pagination);
      const { data, error } = await query;

      if (error) throw error;

      // Transform data to standardized format
      const transformedEmployees = (data || []).map((emp: any) => ({
        ...emp,
        position: emp.job_titles?.title || 'No title',
        job_title_name: emp.job_titles?.title || null,
        department: emp.departments?.name || 'No department',
        department_name: emp.departments?.name || null,
        company: emp.companies ? {
          id: emp.companies.id,
          name: emp.companies.name
        } : null,
        current_nationality_name: emp.current_nationality?.name || null,
        sponsored_by_company_name: emp.sponsored_by_company?.name || null,
      }));

      setEmployees(transformedEmployees);
      if (data?.length) setTotalCount(data.length);

      if (enablePagination && pagination) {
        return {
          data: transformedEmployees,
          count: transformedEmployees.length,
          page: pagination.page,
          pageSize: pagination.pageSize,
        };
      }

      return transformedEmployees;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return enablePagination ? { data: [], count: 0, page: 1, pageSize: defaultPageSize } : [];
    } finally {
      setLoading(false);
    }
  }, [buildQuery, enablePagination, defaultPageSize, toast]);

  const fetchEmployeeDetail = useCallback(async (employeeId: string): Promise<EmployeeDetailResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_employee_complete', { employee_uuid: employeeId });

      if (error) throw error;
      if (!data) return null;

      return data as unknown as EmployeeDetailResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee details';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refetch = useCallback((
    filters?: EmployeeFilters,
    sort?: EmployeeSortOptions,
    pagination?: PaginationOptions
  ) => {
    return fetchEmployees(filters, sort, pagination);
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    totalCount,
    fetchEmployees,
    fetchEmployeeDetail,
    refetch,
  };
}

// Performance optimization hook for large datasets
export function useEmployeePagination(pageSize: number = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [sort, setSort] = useState<EmployeeSortOptions>({ field: 'first_name', direction: 'asc' });

  const query = useEmployeeQuery({ enablePagination: true, defaultPageSize: pageSize });

  const loadPage = useCallback(async (page: number) => {
    setCurrentPage(page);
    return await query.fetchEmployees(filters, sort, { page, pageSize });
  }, [query, filters, sort, pageSize]);

  const updateFilters = useCallback((newFilters: Partial<EmployeeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const updateSort = useCallback((newSort: EmployeeSortOptions) => {
    setSort(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  }, []);

  return {
    ...query,
    currentPage,
    filters,
    sort,
    pageSize,
    loadPage,
    updateFilters,
    updateSort,
    setCurrentPage,
  };
}