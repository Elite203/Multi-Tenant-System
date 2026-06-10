import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  User, 
  Mail, 
  Grid3X3, 
  List, 
  Archive,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  position?: string;
  department: string | null;
  status: string;
  employee_type: string;
  hire_date: string;
  salary?: number | null;
  immigration_status?: string | null;
  profile_photo?: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  sponsored_by_company_name?: string | null;
  current_nationality_name?: string | null;
}

const Employees = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState("first_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showSalary, setShowSalary] = useState(false);
  const [groupBy, setGroupBy] = useState<string>(() => localStorage.getItem('employees-groupBy') || "none");

  const { canManageEmployees, role: userRole } = usePermissions();
  const canManage = canManageEmployees;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success-light text-success border-success/20";
      case "inactive":
        return "bg-muted text-muted-foreground border-border";
      case "on-leave":
        return "bg-warning-light text-warning border-warning/20";
      case "terminated":
        return "bg-destructive-light text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies!fk_employees_company(name),
          job_titles!fk_employees_job_title(title),
          departments!fk_employees_department(name),
          current_nationality:countries!fk_employees_current_nationality(name),
          sponsored_by_company:companies!fk_employees_sponsored_by_company(name)
        `)
        .order('first_name');

      if (error) throw error;
      
      // Transform the data to include resolved names
      const transformedData = (data || []).map(employee => {
        const companyData = Array.isArray(employee.companies) ? employee.companies[0] : employee.companies;
        const jobTitleData = Array.isArray(employee.job_titles) ? employee.job_titles[0] : employee.job_titles;
        const departmentData = Array.isArray(employee.departments) ? employee.departments[0] : employee.departments;
        const nationalityData = Array.isArray(employee.current_nationality) ? employee.current_nationality[0] : employee.current_nationality;
        const sponsorData = Array.isArray(employee.sponsored_by_company) ? employee.sponsored_by_company[0] : employee.sponsored_by_company;
        
        return {
          ...employee,
          position: jobTitleData?.title || 'No title',
          job_title_name: jobTitleData?.title || null,
          department: departmentData?.name || 'No department',
          department_name: departmentData?.name || null,
          company: { 
            id: employee.company_id, 
            name: companyData?.name || 'Unknown' 
          },
          current_nationality_name: nationalityData?.name,
          sponsored_by_company_name: sponsorData?.name
        };
      });
      
      setEmployees(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.job_title && employee.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    
    // Filter out archived employees unless showArchived is true
    const matchesArchiveFilter = showArchived || employee.status !== 'archived';

    return matchesSearch && matchesStatus && matchesDepartment && matchesArchiveFilter;
  });

  const uniqueDepartments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  // Calculate stats (use filtered data when filters are applied)
  const hasActiveFilters = searchTerm || statusFilter !== "all" || departmentFilter !== "all" || showArchived;
  const statsEmployees = hasActiveFilters ? filteredEmployees : employees;
  
  const totalEmployees = statsEmployees.length;
  const activeEmployees = statsEmployees.filter(emp => emp.status === 'active').length;
  const totalDepartments = [...new Set(statsEmployees.map(emp => emp.department).filter(Boolean))].length;
  const averageSalary = showSalary 
    ? statsEmployees.length > 0 
      ? `£${Math.round(statsEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / statsEmployees.length).toLocaleString()}`
      : "£0"
    : "••••••";

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue = a[sortField as keyof Employee] || '';
    let bValue = b[sortField as keyof Employee] || '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Group employees
  const getGroupedEmployees = () => {
    if (groupBy === "none") {
      return { "All Employees": sortedEmployees };
    }
    
    return sortedEmployees.reduce((groups, employee) => {
      let groupKey: string;
      
      switch (groupBy) {
        case "department":
          groupKey = employee.department || "No Department";
          break;
        case "status": 
          groupKey = employee.status;
          break;
        case "employee_type":
          groupKey = employee.employee_type;
          break;
        case "job_title":
          groupKey = employee.position || "No Title";
          break;
        case "sponsored":
          groupKey = employee.sponsored_by_company_name ? "Sponsored" : "Not Sponsored";
          break;
        case "immigration_status":
          groupKey = employee.immigration_status || "Unknown Status";
          break;
        case "company":
          groupKey = employee.company?.name || "Unknown Company";
          break;
        case "hire_year":
          groupKey = new Date(employee.hire_date).getFullYear().toString();
          break;
        default:
          groupKey = "All Employees";
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(employee);
      return groups;
    }, {} as Record<string, Employee[]>);
  };

  const groupedEmployees = getGroupedEmployees();

  if (loading) {
    return (
      <ErrorBoundary>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading employees...</p>
            </div>
          </div>
        </Layout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="space-y-8">
          {/* Hero Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                All Employees
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your organization's workforce
              </p>
          </div>
          {canManage && (
            <AddEmployeeDialog onEmployeeAdded={fetchEmployees} />
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={hasActiveFilters ? "Filtered Employees" : "Total Employees"}
            value={totalEmployees}
            icon={Users}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
          />
          <StatsCard
            title={hasActiveFilters ? "Active (Filtered)" : "Active Employees"}
            value={activeEmployees}
            icon={User}
            className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20"
          />
          <StatsCard
            title={hasActiveFilters ? "Departments (Filtered)" : "Departments"}
            value={totalDepartments}
            icon={Building2}
            className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20"
          />
          <div className="relative">
            <StatsCard
              title={hasActiveFilters ? "Avg Salary (Filtered)" : "Average Salary"}
              value={averageSalary}
              icon={showSalary ? Eye : EyeOff}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => setShowSalary(!showSalary)}
            >
              {showSalary ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Filter System */}
        <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("all")}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All Status
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setStatusFilter("inactive")}
                >
                  Inactive
                </Button>
                <Button
                  variant={showArchived ? "destructive" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? "Hide" : "Show"} Archived
                </Button>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full lg:w-[200px] rounded-xl">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-card border-0 shadow-hero">
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept!}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(value) => {
                setGroupBy(value);
                localStorage.setItem('employees-groupBy', value);
              }}>
                <SelectTrigger className="w-full lg:w-[200px] rounded-xl">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-card border-0 shadow-hero">
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="employee_type">Employee Type</SelectItem>
                  <SelectItem value="job_title">Job Title</SelectItem>
                  <SelectItem value="sponsored">Sponsored Status</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="hire_year">Hire Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search & Controls */}
        <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees by name, ID, title, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-background/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select 
                  value={`${sortField}-${sortDirection}`} 
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    setSortField(field);
                    setSortDirection(direction as "asc" | "desc");
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-xl">
                    <div className="flex items-center gap-2">
                      {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-card border-0 shadow-hero">
                    <SelectItem value="first_name-asc">Name A-Z</SelectItem>
                    <SelectItem value="first_name-desc">Name Z-A</SelectItem>
                    <SelectItem value="hire_date-desc">Newest First</SelectItem>
                    <SelectItem value="hire_date-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as "grid" | "table")}
                  className="border rounded-xl p-1 bg-background/50"
                >
                  <ToggleGroupItem value="grid" className="rounded-lg">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" className="rounded-lg">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                {canManage && (
                  <AddEmployeeDialog onEmployeeAdded={fetchEmployees} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Count */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              Showing {sortedEmployees.length} of {employees.length} employees
            </span>
          </div>
          <div className="flex items-center gap-3">
            {["active", "inactive", "archived"].map(status => {
              const count = sortedEmployees.filter(emp => emp.status === status).length;
              if (count === 0) return null;
              return (
                <Badge 
                  key={status} 
                  variant="outline" 
                  className="text-xs capitalize"
                >
                  {status}: {count}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Employee Display */}
        {sortedEmployees.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedEmployees).map(([groupName, employees]) => (
              <div key={groupName} className="space-y-6">
                {groupBy !== 'none' && (
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground bg-gradient-hero bg-clip-text text-transparent">
                        {groupName}
                      </h3>
                      <Badge variant="outline" className="text-sm font-medium">
                        {employees.length} employee{employees.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                    {employees.map((employee) => {
                      const isSponsored = employee.sponsored_by_company_name;
                      return (
                        <Link key={employee.id} to={`/employees/${employee.id}`}>
                           <Card className={cn(
                              "relative cursor-pointer border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20",
                              isSponsored && "shadow-xl shadow-primary/40 border-primary/20 bg-gradient-to-br from-primary/5 to-background"
                            )}>
                             {/* Status Badge */}
                             <div className="absolute top-4 right-4 z-10">
                               <Badge 
                                 className={cn("text-xs", getStatusColor(employee.status))}
                               >
                                 {employee.status}
                               </Badge>
                             </div>
                            
                            <CardContent className="p-6">
                               {/* Avatar Section */}
                               <div className="flex flex-col items-center text-center mb-4">
                                 <Avatar className="h-20 w-20 mb-3">
                                   <AvatarImage src={employee.profile_photo || ''} alt={`${employee.first_name} ${employee.last_name}`} />
                                   <AvatarFallback className="bg-gradient-primary text-white shadow-glow text-xl font-semibold">
                                     {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                                   </AvatarFallback>
                                 </Avatar>
                                 <h3 className="text-lg font-semibold text-foreground">
                                   {employee.first_name} {employee.last_name}
                                 </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {employee.position || 'No title'} • {employee.department || 'No department'}
                                  </p>
                               </div>

                               {/* Contact Info */}
                               <div className="space-y-2 mb-4">
                                 {employee.email && (
                                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                     <Mail className="h-3 w-3" />
                                     <span className="truncate">{employee.email}</span>
                                   </div>
                                 )}
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <Calendar className="h-3 w-3" />
                                   <span>Joined {new Date(employee.hire_date).toLocaleDateString()}</span>
                                 </div>
                               </div>

                               {/* Footer */}
                               <div className="flex items-center justify-between pt-3 border-t border-border/20">
                                 <span className="text-xs text-muted-foreground">
                                   ID: {employee.employee_number}
                                 </span>
                                 <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="text-xs">
                                     {employee.employee_type}
                                   </Badge>
                                   {employee.sponsored_by_company_name && (
                                     <Badge 
                                       className="text-xs bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold"
                                     >
                                       Sponsored
                                     </Badge>
                                   )}
                                 </div>
                               </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employees.map((employee) => {
                      const isSponsored = employee.sponsored_by_company_name;
                      return (
                        <Card 
                          key={employee.id} 
                          className={`border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20 group ${
                            isSponsored ? 'border-primary/30' : ''
                          }`}
                        >
                          <div className={`p-6 hover:bg-muted/30 transition-colors ${
                            isSponsored ? 'bg-gradient-to-r from-primary/10 to-accent/10' : ''
                          }`}>
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex items-start space-x-5 flex-1 cursor-pointer"
                                onClick={() => window.location.href = `/employees/${employee.id}`}
                              >
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={employee.profile_photo} alt={`${employee.first_name} ${employee.last_name}`} />
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-medium">
                                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground truncate">
                                      {employee.first_name} {employee.last_name}
                                    </h3>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", getStatusColor(employee.status))}
                                    >
                                      {employee.status.replace(/[-_]/g, ' ')}
                                    </Badge>
                                    {isSponsored && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs bg-primary/10 text-primary border-primary/20"
                                      >
                                        Sponsored
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-3 truncate">
                                    {employee.position || 'No title'} • {employee.department}
                                  </p>
                                  
                                   <div className="space-y-1">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                       <Mail className="h-3 w-3" />
                                       <span className="truncate">{employee.email}</span>
                                     </div>
                                   </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border">
                                  <DropdownMenuItem onClick={() => window.location.href = `/employees/${employee.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </DropdownMenuItem>
                                  {(userRole === 'admin' || userRole === 'hr') && (
                                    <>
                                      <DropdownMenuItem onClick={() => {/* TODO: Implement edit */}}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Employee
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => {/* TODO: Implement delete */}}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Employee
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Employee ID: {employee.employee_number}</span>
                                <Button variant="outline" size="sm" onClick={() => window.location.href = `/employees/${employee.id}`}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gradient-primary text-white flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for"
                    : "Get started by adding your first employee to begin managing your workforce"}
                </p>
                {canManage && (
                  <AddEmployeeDialog onEmployeeAdded={fetchEmployees} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default Employees;