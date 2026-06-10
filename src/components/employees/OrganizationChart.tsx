import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Building2, User, Crown, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  parent_company_id?: string;
}

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  job_title_name?: string;
  department: string | null;
  department_name?: string;
  employee_type: string;
  status: string;
  manager_id: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  directReports?: Employee[];
}

interface OrganizationChartProps {
  selectedCompanyId?: string;
  selectedDepartment?: string;
}

export function OrganizationChart({ selectedCompanyId, selectedDepartment }: OrganizationChartProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState(selectedCompanyId || "all");
  const [departmentFilter, setDepartmentFilter] = useState(selectedDepartment || "all");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch employees with related data using joins
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          companies!fk_employees_company(id, name),
          departments!fk_employees_department(name),
          job_titles!fk_employees_job_title(title)
        `)
        .eq('status', 'active')
        .order('first_name');

      if (employeesError) throw employeesError;

      // Fetch companies for filter
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      // Transform employees to include resolved names
      const enrichedEmployees = (employeesData || []).map(emp => {
        const companyData = Array.isArray(emp.companies) ? emp.companies[0] : emp.companies;
        const jobTitleData = Array.isArray(emp.job_titles) ? emp.job_titles[0] : emp.job_titles;
        const departmentData = Array.isArray(emp.departments) ? emp.departments[0] : emp.departments;
        
        return {
          ...emp,
          job_title: jobTitleData?.title || null,
          job_title_name: jobTitleData?.title || null,
          department: departmentData?.name || null,
          department_name: departmentData?.name || null,
          company: companyData || { id: '', name: 'Unknown' }
        };
      });
      
      setEmployees(enrichedEmployees);
      setCompanies(companiesData || []);

      // Extract unique departments
      const uniqueDepartments = [...new Set(
        (employeesData || [])
          .map(emp => emp.department)
          .filter(Boolean)
      )];
      setDepartments(uniqueDepartments);

    } catch (error) {
      // Error handled by toast
      toast({
        title: "Error",
        description: "Failed to load organization chart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (employees: Employee[]): Employee[] => {
    const filteredEmployees = employees.filter(emp => {
      const matchesSearch = 
        emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompany = companyFilter === "all" || emp.company?.id === companyFilter;
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;

      return matchesSearch && matchesCompany && matchesDepartment;
    });

    // Create a map for quick lookup
    const employeeMap = new Map(filteredEmployees.map(emp => [emp.id, { ...emp, directReports: [] }]));

    // Build the hierarchy
    const roots: Employee[] = [];

    filteredEmployees.forEach(emp => {
      const employee = employeeMap.get(emp.id)!;
      
      if (!emp.manager_id || !employeeMap.has(emp.manager_id)) {
        // This is a root node (no manager or manager not in filtered results)
        roots.push(employee);
      } else {
        // Add to manager's direct reports
        const manager = employeeMap.get(emp.manager_id)!;
        manager.directReports!.push(employee);
      }
    });

    return roots;
  };

  const toggleExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getEmployeeTypeIcon = (type: string) => {
    switch (type) {
      case 'executive':
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'director':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'manager':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const EmployeeNode = ({ employee, level = 0 }: { employee: Employee; level?: number }) => {
    const hasDirectReports = employee.directReports && employee.directReports.length > 0;
    const isExpanded = expandedNodes.has(employee.id);

    return (
      <div className={cn("relative", level > 0 && "ml-6")}>
        {/* Connection line for hierarchy */}
        {level > 0 && (
          <div className="absolute -left-3 top-6 w-3 h-px bg-border"></div>
        )}
        
        <div className="flex items-start gap-3 mb-4">
          {/* Expand/collapse button */}
          {hasDirectReports && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(employee.id)}
              className="h-6 w-6 p-0 mt-3"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Employee card */}
          <Link to={`/employees/${employee.id}`} className="flex-1">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">
                        {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {employee.job_title_name || 'No title'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.department_name || 'No department'} • #{employee.employee_number}
                      </p>
                      {hasDirectReports && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {employee.directReports!.length} direct report{employee.directReports!.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getEmployeeTypeIcon(employee.employee_type)}
                    <Badge variant="outline" className="text-xs">
                      {employee.employee_type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Direct reports */}
        {hasDirectReports && isExpanded && (
          <div className="relative">
            {/* Vertical line for hierarchy */}
            <div className="absolute left-3 top-0 w-px h-full bg-border"></div>
            
            {employee.directReports!.map((report, index) => (
              <div key={report.id} className="relative">
                {/* Horizontal connection line */}
                <div className="absolute left-3 top-6 w-3 h-px bg-border"></div>
                
                <EmployeeNode employee={report} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading organization chart...</div>
        </CardContent>
      </Card>
    );
  }

  const hierarchy = buildHierarchy(employees);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {hierarchy.length} top-level employee{hierarchy.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
            >
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = new Set<string>();
                const collectIds = (emps: Employee[]) => {
                  emps.forEach(emp => {
                    if (emp.directReports && emp.directReports.length > 0) {
                      allIds.add(emp.id);
                      collectIds(emp.directReports);
                    }
                  });
                };
                collectIds(hierarchy);
                setExpandedNodes(allIds);
              }}
            >
              Expand All
            </Button>
          </div>
        </div>

        {/* Organization Chart */}
        {hierarchy.length > 0 ? (
          <div className="space-y-4">
            {hierarchy.map((employee) => (
              <EmployeeNode key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
            <p className="text-muted-foreground">
              {searchTerm || companyFilter !== "all" || departmentFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No active employees to display"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}