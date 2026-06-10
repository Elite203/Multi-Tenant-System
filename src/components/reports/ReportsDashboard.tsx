import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, AlertTriangle, Calendar, TrendingUp, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDocuments: number;
  expiringDocuments: number;
  pendingLeaveRequests: number;
  departmentCount: number;
  complianceScore: number;
  recentHires: number;
}

interface QuickReport {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  count?: number;
}

export function ReportsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch multiple statistics in parallel
      const [
        { data: employees },
        { data: documents },
        { data: leaveRequests },
        { data: orgStats }
      ] = await Promise.all([
        supabase.from('employees').select('status, hire_date, compliance_score'),
        supabase.from('documents').select('expiry_date, is_active'),
        supabase.from('leave_requests').select('status'),
        supabase.rpc('get_organization_statistics')
      ]);

      // Calculate stats
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.status === 'active').length || 0;
      
      const totalDocuments = documents?.filter(doc => doc.is_active).length || 0;
      const expiringDocuments = documents?.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      const pendingLeaveRequests = leaveRequests?.filter(req => req.status === 'pending').length || 0;

      const recentHires = employees?.filter(emp => {
        if (!emp.hire_date) return false;
        const hireDate = new Date(emp.hire_date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return hireDate >= thirtyDaysAgo;
      }).length || 0;

      const avgComplianceScore = employees?.reduce((sum, emp) => sum + (emp.compliance_score || 0), 0) / totalEmployees || 0;

      setStats({
        totalEmployees,
        activeEmployees,
        totalDocuments,
        expiringDocuments,
        pendingLeaveRequests,
        departmentCount: (orgStats as any)?.total_departments || 0,
        complianceScore: Math.round(avgComplianceScore),
        recentHires
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

  const quickReports: QuickReport[] = [
    {
      id: 'active_employees',
      name: 'Active Employees',
      description: 'Current active employee directory',
      icon: Users,
      color: 'bg-blue-500',
      count: stats?.activeEmployees
    },
    {
      id: 'expiring_docs',
      name: 'Expiring Documents',
      description: 'Documents expiring in next 30 days',
      icon: AlertTriangle,
      color: 'bg-red-500',
      count: stats?.expiringDocuments
    },
    {
      id: 'pending_leave',
      name: 'Pending Leave',
      description: 'Leave requests awaiting approval',
      icon: Calendar,
      color: 'bg-orange-500',
      count: stats?.pendingLeaveRequests
    },
    {
      id: 'recent_hires',
      name: 'Recent Hires',
      description: 'New employees in last 30 days',
      icon: TrendingUp,
      color: 'bg-green-500',
      count: stats?.recentHires
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats?.totalEmployees || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Documents</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{stats?.departmentCount || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats?.complianceScore || 0}%</p>
                  <Progress value={stats?.complianceScore || 0} className="w-16" />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${report.color}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{report.name}</h4>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                      {report.count !== undefined && (
                        <Badge variant={report.count > 0 ? "default" : "outline"}>
                          {report.count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.expiringDocuments ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Documents Expiring Soon</p>
                  <p className="text-sm text-red-600">{stats.expiringDocuments} documents need renewal</p>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            ) : null}

            {stats?.pendingLeaveRequests ? (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-800">Pending Leave Requests</p>
                  <p className="text-sm text-orange-600">{stats.pendingLeaveRequests} requests awaiting approval</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            ) : null}

            {!stats?.expiringDocuments && !stats?.pendingLeaveRequests && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No immediate attention required</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.recentHires ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">New Hires</p>
                  <p className="text-sm text-green-600">{stats.recentHires} employees joined this month</p>
                </div>
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </div>
            ) : null}

            {!stats?.recentHires && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}