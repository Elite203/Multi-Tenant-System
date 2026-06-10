import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface AdvancedAnalytics {
  totalEmployees: number;
  averageTenure: number;
  turnoverRate: number;
  averageSalary: number | null;
  salaryRanges: { range: string; count: number; percentage: number }[];
  tenureDistribution: { range: string; count: number; percentage: number }[];
  departmentGrowth: { department: string; current: number; lastMonth: number; growth: number }[];
  monthlyHires: { month: string; hires: number; terminations: number }[];
  complianceScore: number;
  expiringDocuments: number;
}

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("12m");
  const { toast } = useToast();
  const { profile } = useAuth();
  const { canViewSensitiveData } = usePermissions();
  const canViewSalaries = canViewSensitiveData;

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [timeRange]);

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);

      // Get date ranges
      const now = new Date();
      const months = timeRange === "6m" ? 6 : 12;
      const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Fetch employees with detailed data
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          hire_date,
          status,
          department,
          salary,
          created_at,
          updated_at
        `)
        .gte('hire_date', startDate.toISOString().split('T')[0]);

      if (employeesError) throw employeesError;

      // Fetch documents for compliance
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('expiry_date, is_active')
        .eq('is_active', true);

      if (documentsError) throw documentsError;

      // Calculate metrics
      const currentEmployees = employees?.filter(emp => emp.status === 'active') || [];
      const totalEmployees = currentEmployees.length;

      // Average tenure calculation
      const averageTenure = currentEmployees.reduce((sum, emp) => {
        const tenure = (now.getTime() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return sum + tenure;
      }, 0) / totalEmployees;

      // Turnover rate (simplified - based on status changes)
      const terminatedLastYear = employees?.filter(emp => 
        emp.status === 'terminated' && 
        new Date(emp.updated_at) >= new Date(now.getFullYear() - 1, now.getMonth(), 1)
      ).length || 0;
      const turnoverRate = totalEmployees > 0 ? (terminatedLastYear / totalEmployees) * 100 : 0;

      // Salary analytics (if authorized)
      let averageSalary = null;
      let salaryRanges: { range: string; count: number; percentage: number }[] = [];
      
      if (canViewSalaries) {
        const salaries = currentEmployees
          .map(emp => emp.salary)
          .filter(salary => salary && salary > 0) as number[];
        
        averageSalary = salaries.length > 0 ? salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length : 0;

        // Salary ranges
        const ranges = [
          { range: "£20k-£30k", min: 20000, max: 30000 },
          { range: "£30k-£50k", min: 30000, max: 50000 },
          { range: "£50k-£75k", min: 50000, max: 75000 },
          { range: "£75k-£100k", min: 75000, max: 100000 },
          { range: "£100k+", min: 100000, max: Infinity },
        ];

        salaryRanges = ranges.map(range => {
          const count = salaries.filter(sal => sal >= range.min && sal < range.max).length;
          return {
            range: range.range,
            count,
            percentage: salaries.length > 0 ? Math.round((count / salaries.length) * 100) : 0
          };
        });
      }

      // Tenure distribution
      const tenureRanges = [
        { range: "0-1 years", min: 0, max: 1 },
        { range: "1-3 years", min: 1, max: 3 },
        { range: "3-5 years", min: 3, max: 5 },
        { range: "5-10 years", min: 5, max: 10 },
        { range: "10+ years", min: 10, max: Infinity },
      ];

      const tenureDistribution = tenureRanges.map(range => {
        const count = currentEmployees.filter(emp => {
          const tenure = (now.getTime() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
          return tenure >= range.min && tenure < range.max;
        }).length;
        return {
          range: range.range,
          count,
          percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
        };
      });

      // Department growth (simplified)
      const departments = [...new Set(currentEmployees.map(emp => emp.department).filter(Boolean))];
      const departmentGrowth = departments.map(dept => {
        const current = currentEmployees.filter(emp => emp.department === dept).length;
        const lastMonthEmployees = employees?.filter(emp => 
          emp.department === dept && 
          emp.status === 'active' &&
          new Date(emp.hire_date) <= lastMonth
        ).length || 0;
        const growth = lastMonthEmployees > 0 ? ((current - lastMonthEmployees) / lastMonthEmployees) * 100 : 0;
        
        return {
          department: dept,
          current,
          lastMonth: lastMonthEmployees,
          growth: Math.round(growth)
        };
      });

      // Monthly hires/terminations (last 6 months)
      const monthlyHires = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const hires = employees?.filter(emp => {
          const hireDate = new Date(emp.hire_date);
          return hireDate >= monthStart && hireDate <= monthEnd;
        }).length || 0;

        const terminations = employees?.filter(emp => {
          const updateDate = new Date(emp.updated_at);
          return emp.status === 'terminated' && updateDate >= monthStart && updateDate <= monthEnd;
        }).length || 0;

        monthlyHires.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          hires,
          terminations
        });
      }

      // Compliance score based on document expiry
      const expiringDocuments = documents?.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      const totalDocuments = documents?.length || 0;
      const complianceScore = totalDocuments > 0 ? Math.round(((totalDocuments - expiringDocuments) / totalDocuments) * 100) : 100;

      setAnalytics({
        totalEmployees,
        averageTenure: Math.round(averageTenure * 10) / 10,
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        averageSalary,
        salaryRanges,
        tenureDistribution,
        departmentGrowth,
        monthlyHires,
        complianceScore,
        expiringDocuments,
      });

    } catch (error) {
      // Error handled by toast
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">No analytics data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold">{analytics.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Tenure</p>
                <p className="text-3xl font-bold">{analytics.averageTenure}y</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turnover Rate</p>
                <p className="text-3xl font-bold">{analytics.turnoverRate}%</p>
              </div>
              {analytics.turnoverRate > 15 ? (
                <TrendingUp className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-3xl font-bold">{analytics.complianceScore}%</p>
                {analytics.expiringDocuments > 0 && (
                  <p className="text-xs text-red-500">{analytics.expiringDocuments} expiring docs</p>
                )}
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenure Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Tenure Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tenureDistribution.map((item) => (
                <div key={item.range} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.range}</span>
                    <span>{item.count} employees ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Salary Ranges (if authorized) */}
        {canViewSalaries && analytics.averageSalary && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Salary Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Average Salary</p>
                <p className="text-2xl font-bold">£{analytics.averageSalary.toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                {analytics.salaryRanges.map((range) => (
                  <div key={range.range} className="flex items-center justify-between">
                    <span className="text-sm">{range.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {range.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Department Growth */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Department Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.departmentGrowth.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{dept.department}</p>
                    <p className="text-sm text-muted-foreground">{dept.current} employees</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={dept.growth > 0 ? "default" : dept.growth < 0 ? "destructive" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {dept.growth > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : dept.growth < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {dept.growth > 0 ? '+' : ''}{dept.growth}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Hiring Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.monthlyHires.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-green-600">+{month.hires} hired</p>
                      {month.terminations > 0 && (
                        <p className="text-sm text-red-600">-{month.terminations} left</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      Net: {month.hires - month.terminations > 0 ? '+' : ''}{month.hires - month.terminations}
                    </Badge>
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