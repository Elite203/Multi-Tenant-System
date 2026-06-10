import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeNode {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title_name: string | null;
  department_name: string | null;
  employee_type: string;
  status: string;
  manager_id: string | null;
  manager_name: string | null;
  company_name: string | null;
  profile_photo: string | null;
  role: string;
  level: number;
  path: string[];
  children?: EmployeeNode[];
}

export interface OrgStatistics {
  total_employees: number;
  total_departments: number;
  hierarchy_levels: number;
  managers_count: number;
  top_level_employees: number;
}

export const useOrgChart = () => {
  return useQuery({
    queryKey: ['organizational-hierarchy'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_organizational_hierarchy');
      
      if (error) {
        console.error('Error fetching organizational hierarchy:', error);
        throw error;
      }
      
      return data as EmployeeNode[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrgStatistics = () => {
  return useQuery({
    queryKey: ['organization-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_organization_statistics');
      
      if (error) {
        console.error('Error fetching organization statistics:', error);
        throw error;
      }
      
      return data as unknown as OrgStatistics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDirectReports = (managerId: string | null) => {
  return useQuery({
    queryKey: ['direct-reports', managerId],
    queryFn: async () => {
      if (!managerId) return [];
      
      const { data, error } = await supabase.rpc('get_direct_reports', {
        manager_uuid: managerId
      });
      
      if (error) {
        console.error('Error fetching direct reports:', error);
        throw error;
      }
      
      // Transform the data to match EmployeeNode interface
      return (data || []).map(item => ({
        ...item,
        manager_id: null, // Direct reports function doesn't need manager info
        manager_name: null,
        level: 0, // Will be calculated in hierarchy
        path: []  // Will be calculated in hierarchy
      })) as EmployeeNode[];
    },
    enabled: !!managerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Smart tree building algorithm that creates hierarchy from flat data
export const buildHierarchyTree = (employees: EmployeeNode[]): EmployeeNode[] => {
  // Create a map for O(1) lookups
  const employeeMap = new Map<string, EmployeeNode>();
  
  // Initialize all employees with empty children arrays
  employees.forEach(emp => {
    employeeMap.set(emp.id, { ...emp, children: [] });
  });
  
  // Build parent-child relationships
  const rootNodes: EmployeeNode[] = [];
  
  employees.forEach(emp => {
    const employee = employeeMap.get(emp.id)!;
    
    if (!emp.manager_id || !employeeMap.has(emp.manager_id)) {
      // Root node (no manager or manager not in dataset)
      // Only show admin and director roles as root nodes
      if (emp.role === 'admin' || emp.role === 'director' || emp.level === 0) {
        rootNodes.push(employee);
      }
    } else {
      // Add to manager's children
      const manager = employeeMap.get(emp.manager_id)!;
      manager.children!.push(employee);
    }
  });
  
  // Sort root nodes by role priority and name
  rootNodes.sort((a, b) => {
    const getRolePriority = (role: string) => {
      switch (role) {
        case 'admin': return 1;
        case 'director': return 2;
        case 'hr': return 3;
        default: return 4;
      }
    };
    
    const priorityDiff = getRolePriority(a.role) - getRolePriority(b.role);
    if (priorityDiff !== 0) return priorityDiff;
    
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });
  
  // Recursively sort all children
  const sortChildren = (node: EmployeeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        // Sort by role first, then by name
        const getRolePriority = (role: string) => {
          switch (role) {
            case 'admin': return 1;
            case 'director': return 2;
            case 'hr': return 3;
            default: return 4;
          }
        };
        
        const priorityDiff = getRolePriority(a.role) - getRolePriority(b.role);
        if (priorityDiff !== 0) return priorityDiff;
        
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
      
      node.children.forEach(sortChildren);
    }
  };
  
  rootNodes.forEach(sortChildren);
  
  return rootNodes;
};

// Filter function for search and department filtering
export const filterEmployees = (
  employees: EmployeeNode[],
  searchTerm: string,
  departmentFilter: string
): EmployeeNode[] => {
  if (!searchTerm && departmentFilter === 'all') return employees;
  
  const matchesFilter = (emp: EmployeeNode): boolean => {
    const matchesSearch = !searchTerm || 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_title_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || emp.department_name === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  };
  
  return employees.filter(matchesFilter);
};