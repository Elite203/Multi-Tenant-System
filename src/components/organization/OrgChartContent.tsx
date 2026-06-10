import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Building2, 
  User, 
  Crown, 
  ChevronDown, 
  ChevronRight,
  Download,
  Expand,
  Minimize
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOrgChart, useOrgStatistics, buildHierarchyTree, filterEmployees, EmployeeNode } from "@/hooks/useOrgChart";
import { useToast } from "@/hooks/use-toast";

export function OrgChartContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: employees = [], isLoading, error } = useOrgChart();
  const { data: statistics } = useOrgStatistics();

  // Get unique departments for filter
  const departments = useMemo(() => {
    const uniqueDepts = new Set(
      employees
        .map(emp => emp.department_name)
        .filter(Boolean)
    );
    return Array.from(uniqueDepts).sort();
  }, [employees]);

  // Filter and build hierarchy
  const hierarchy = useMemo(() => {
    const filtered = filterEmployees(employees, searchTerm, departmentFilter);
    return buildHierarchyTree(filtered);
  }, [employees, searchTerm, departmentFilter]);

  const toggleExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: EmployeeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(hierarchy);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const exportOrgChart = () => {
    const csvData = employees.map(emp => ({
      Name: `${emp.first_name} ${emp.last_name}`,
      'Job Title': emp.job_title_name || '',
      Department: emp.department_name || '',
      'Employee Type': emp.employee_type,
      Role: emp.role,
      Manager: emp.manager_name || '',
      Level: emp.level,
      'Employee Number': emp.employee_number
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization-chart.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Organization chart data has been downloaded",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground';
      case 'director': return 'bg-gradient-to-r from-purple-500 to-purple-400 text-white';
      case 'hr': return 'border-secondary/50';
      case 'manager': return 'border-primary/50';
      default: return '';
    }
  };

  const getEmployeeTypeIcon = (type: string, role: string) => {
    if (role === 'admin') return <Crown className="h-4 w-4 text-yellow-400" />;
    if (role === 'director') return <Crown className="h-4 w-4 text-purple-400" />;
    
    switch (type) {
      case 'executive':
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'director':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'manager':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const EmployeeCard = ({ employee, level = 0 }: { employee: EmployeeNode; level?: number }) => {
    const hasChildren = employee.children && employee.children.length > 0;
    const isExpanded = expandedNodes.has(employee.id);
    const isExecutive = employee.role === 'admin' || employee.role === 'director';

    // Highlight matching search terms
    const highlightText = (text: string) => {
      if (!searchTerm) return text;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    };

    return (
      <div className={cn("relative", level > 0 && "ml-8")}>
        {/* Connection lines */}
        {level > 0 && (
          <>
            <div className="absolute -left-4 top-1/2 w-4 h-px bg-border"></div>
            <div className="absolute -left-4 top-0 w-px h-1/2 bg-border"></div>
          </>
        )}
        
        <div className="flex items-start gap-3 mb-6">
          {/* Expand/collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(employee.id)}
              className="h-8 w-8 p-0 mt-4 hover:bg-primary/10"
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
            <Card className={cn(
              "hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]",
              employee.role === 'admin' || employee.role === 'director' 
                ? "ring-1 ring-primary/20 bg-gradient-to-r from-primary/5 to-primary/10"
                : employee.role === 'hr'
                ? "border-l-4 border-l-secondary/50"
                : employee.employee_type === 'manager'
                ? "border-l-4 border-l-primary/50"
                : ""
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className={cn(
                      isExecutive ? "h-14 w-14" : "h-12 w-12",
                      "ring-2 ring-background"
                    )}>
                      <AvatarImage src={employee.profile_photo || undefined} />
                      <AvatarFallback className={cn(
                        isExecutive ? "text-lg font-bold" : "text-sm font-medium",
                        employee.role === 'admin' ? "bg-primary text-primary-foreground" :
                        employee.role === 'director' ? "bg-purple-500 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className={cn(
                        "font-semibold text-foreground truncate",
                        isExecutive ? "text-lg" : "text-base"
                      )} dangerouslySetInnerHTML={{
                        __html: highlightText(`${employee.first_name} ${employee.last_name}`)
                      }} />
                      
                      <p className="text-sm text-muted-foreground truncate mt-1" 
                         dangerouslySetInnerHTML={{
                           __html: highlightText(employee.job_title_name || 'No title')
                         }} />
                      
                      <p className="text-xs text-muted-foreground mt-1"
                         dangerouslySetInnerHTML={{
                           __html: highlightText(employee.department_name || 'No department')
                         }} />
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          #{employee.employee_number}
                        </Badge>
                        {hasChildren && (
                          <Badge variant="secondary" className="text-xs">
                            {employee.children!.length} report{employee.children!.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    {getEmployeeTypeIcon(employee.employee_type, employee.role)}
                    <Badge 
                      variant={employee.role === 'admin' || employee.role === 'director' ? 'default' : 'outline'} 
                      className={cn(
                        "text-xs capitalize",
                        employee.role === 'admin' ? "bg-primary text-primary-foreground" :
                        employee.role === 'director' ? "bg-purple-500 text-white" :
                        ""
                      )}
                    >
                      {employee.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {level > 0 && (
              <div className="absolute -left-4 top-0 w-px h-full bg-border"></div>
            )}
            
            {employee.children!.map((child, index) => (
              <div key={child.id} className="relative">
                {index < employee.children!.length - 1 && level >= 0 && (
                  <div className="absolute left-4 top-20 w-px h-full bg-border"></div>
                )}
                <EmployeeCard employee={child} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error loading organization chart</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Organization Chart
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore your company's hierarchical structure and understand reporting relationships across teams and departments.
        </p>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={expandAll} variant="outline" className="gap-2">
            <Expand className="h-4 w-4" />
            Expand All
          </Button>
          <Button onClick={collapseAll} variant="outline" className="gap-2">
            <Minimize className="h-4 w-4" />
            Collapse All
          </Button>
          <Button onClick={exportOrgChart} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, department, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      {hierarchy.length > 0 ? (
        <div className="space-y-8">
          {hierarchy.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-medium text-foreground mb-3">No employees found</h3>
              <p className="text-muted-foreground">
                {searchTerm || departmentFilter !== "all"
                  ? "Try adjusting your search criteria or filters"
                  : "No organizational structure available"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Dashboard */}
      {statistics && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Organization Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{statistics.total_employees}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{statistics.total_departments}</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{statistics.hierarchy_levels}</div>
                <div className="text-sm text-muted-foreground">Hierarchy Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{statistics.managers_count}</div>
                <div className="text-sm text-muted-foreground">Managers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{statistics.top_level_employees}</div>
                <div className="text-sm text-muted-foreground">Leadership</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}