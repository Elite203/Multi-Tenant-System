import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Building2, Crown, User, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface TeamAnalytics {
  totalEmployees: number;
  departments: { name: string; count: number; percentage: number }[];
  employeeTypes: { type: string; count: number; percentage: number }[];
  companies: { name: string; count: number; percentage: number }[];
  recentHires: Array<{
    id: string;
    first_name: string;
    last_name: string;
    job_title: string | null;
    hire_date: string;
  }>;
}

export function TeamAnalytics() {
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all active employees with related data using joins
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies!fk_employees_company(id, name),
          departments!fk_employees_department(name),
          job_titles!fk_employees_job_title(title)
        `)
        .eq('status', 'active')
        .order('hire_date', { ascending: false });

      if (error) throw error;
      
      // Transform employees to include resolved names
      const enrichedEmployees = (employees || []).map(emp => {
        const companyData = Array.isArray(emp.companies) ? emp.companies[0] : emp.companies;
        const jobTitleData = Array.isArray(emp.job_titles) ? emp.job_titles[0] : emp.job_titles;
        const departmentData = Array.isArray(emp.departments) ? emp.departments[0] : emp.departments;
        
        return {
          ...emp,
          job_title: jobTitleData?.title || null,
          department: departmentData?.name || null,
          company: companyData || { id: '', name: 'Unknown' }
        };
      });

      const totalEmployees = enrichedEmployees?.length || 0;

      // Calculate department distribution
      const departmentCounts = (enrichedEmployees || []).reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const departments = Object.entries(departmentCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate employee type distribution
      const typeCounts = (employees || []).reduce((acc, emp) => {
        acc[emp.employee_type] = (acc[emp.employee_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const employeeTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate company distribution
      const companyCounts = (enrichedEmployees || []).reduce((acc, emp) => {
        const companyName = emp.company?.name || 'Unknown';
        acc[companyName] = (acc[companyName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const companiesAnalytics = Object.entries(companyCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentHires = (employees || [])
        .filter(emp => new Date(emp.hire_date) >= thirtyDaysAgo)
        .slice(0, 5);

      setAnalytics({
        totalEmployees,
        departments,
        employeeTypes,
        companies: companiesAnalytics,
        recentHires,
      });

    } catch (error) {
      // Error handled by toast
      toast({
        title: "Error",
        description: "Failed to load team analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive':
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'director':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{analytics.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{analytics.departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Hires</p>
                <p className="text-2xl font-bold">{analytics.recentHires.length}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{analytics.companies.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.departments.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {dept.count} ({dept.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.employeeTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(type.type)}
                    <span className="font-medium capitalize">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getTypeColor(type.type)}>
                      {type.count}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {type.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Hires & Company Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Hires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentHires.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentHires.map((hire) => (
                  <Link key={hire.id} to={`/employees/${hire.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {hire.first_name.charAt(0)}{hire.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {hire.first_name} {hire.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {hire.job_title || 'No title'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(hire.hire_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent hires in the last 30 days</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Company Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.companies.map((company) => (
                <div key={company.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{company.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {company.count} ({company.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${company.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}