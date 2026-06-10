import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { DateRange } from "react-day-picker";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Clock, FileCheck } from "lucide-react";

interface Employee {
  id?: string;
  hire_date?: string;
  termination_date?: string;
  department_name?: string;
  department?: string;
  status: string;
  created_at?: string;
}

interface LeaveRequest {
  id?: string;
  start_date: string;
  status: string;
  created_at?: string;
}

interface EmployeeDocument {
  id?: string;
  category: string;
  expiry_date?: string;
  created_at: string;
}

interface TimesheetData {
  id?: string;
  hours: number;
  overtime_hours?: number;
  week_ending?: string;
  date?: string;
}

interface AnalyticsData {
  employeeTrends: Array<{ month: string; hires: number; terminations: number; active: number }>;
  departmentBreakdown: Array<{ department: string; count: number; fill: string }>;
  leaveAnalytics: Array<{ month: string; requests: number; approved: number; rejected: number }>;
  documentStatus: Array<{ status: string; count: number; fill: string }>;
  timesheetTrends: Array<{ week: string; hours: number; overtime: number }>;
}

export function ReportsAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subDays(new Date(), 90)),
    to: endOfMonth(new Date())
  });
  const [selectedMetric, setSelectedMetric] = useState("employees");
  const { toast } = useToast();

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchAnalyticsData();
    }
  }, [dateRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const [
        { data: employees },
        { data: leaveRequests },
        { data: documents },
        { data: timesheetData }
      ] = await Promise.all([
        supabase.from('employees').select('hire_date, status, department, created_at'),
        supabase.from('leave_requests').select('created_at, status, start_date'),
        supabase.from('documents').select('created_at, category, expiry_date'),
        supabase.from('timesheet_entries').select('date, hours, overtime_hours')
      ]);

      // Process employee trends
      const employeeTrends = processEmployeeTrends(employees || []);
      
      // Process department breakdown
      const departmentBreakdown = processDepartmentBreakdown(employees || []);
      
      // Process leave analytics
      const leaveAnalytics = processLeaveAnalytics(leaveRequests || []);
      
      // Process document status
      const documentStatus = processDocumentStatus(documents || []);
      
      // Process timesheet trends
      const timesheetTrends = processTimesheetTrends(timesheetData || []);

      setAnalyticsData({
        employeeTrends,
        departmentBreakdown,
        leaveAnalytics,
        documentStatus,
        timesheetTrends
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processEmployeeTrends = (employees: Employee[]) => {
    const months = getLast6Months();
    return months.map(month => {
      const monthEmployees = employees.filter(emp => {
        const hireDate = new Date(emp.hire_date);
        return hireDate.getMonth() === month.monthIndex && hireDate.getFullYear() === month.year;
      });

      return {
        month: month.name,
        hires: monthEmployees.length,
        terminations: Math.floor(Math.random() * 3), // Mock data
        active: employees.filter(emp => emp.status === 'active').length
      };
    });
  };

  const processDepartmentBreakdown = (employees: Employee[]) => {
    const departments = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    return Object.entries(departments).map(([department, count], index) => ({
      department,
      count: count as number,
      fill: colors[index % colors.length]
    }));
  };

  const processLeaveAnalytics = (leaveRequests: LeaveRequest[]) => {
    const months = getLast6Months();
    return months.map(month => {
      const monthRequests = leaveRequests.filter(req => {
        const requestDate = new Date(req.created_at);
        return requestDate.getMonth() === month.monthIndex && requestDate.getFullYear() === month.year;
      });

      return {
        month: month.name,
        requests: monthRequests.length,
        approved: monthRequests.filter(req => req.status === 'approved').length,
        rejected: monthRequests.filter(req => req.status === 'rejected').length
      };
    });
  };

  const processDocumentStatus = (documents: EmployeeDocument[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const active = documents.filter(doc => !doc.expiry_date || new Date(doc.expiry_date) > thirtyDaysFromNow).length;
    const expiring = documents.filter(doc => doc.expiry_date && new Date(doc.expiry_date) <= thirtyDaysFromNow && new Date(doc.expiry_date) > now).length;
    const expired = documents.filter(doc => doc.expiry_date && new Date(doc.expiry_date) <= now).length;

    return [
      { status: 'Active', count: active, fill: '#10b981' },
      { status: 'Expiring Soon', count: expiring, fill: '#f59e0b' },
      { status: 'Expired', count: expired, fill: '#ef4444' }
    ];
  };

  const processTimesheetTrends = (timesheetData: TimesheetData[]) => {
    const weeks = getLast8Weeks();
    return weeks.map(week => {
      const weekData = timesheetData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });

      const totalHours = weekData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const totalOvertime = weekData.reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0);

      return {
        week: week.label,
        hours: Math.round(totalHours),
        overtime: Math.round(totalOvertime)
      };
    });
  };

  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }
    return months;
  };

  const getLast8Weeks = () => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const end = new Date(start.getTime() + (6 * 24 * 60 * 60 * 1000));
      weeks.push({
        label: `Week ${8 - i}`,
        start,
        end
      });
    }
    return weeks;
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <DatePickerWithRange 
            date={dateRange} 
            onDateChange={setDateRange}
            className="w-full"
          />
        </div>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employees">Employee Analytics</SelectItem>
            <SelectItem value="leave">Leave Analytics</SelectItem>
            <SelectItem value="timesheets">Timesheet Analytics</SelectItem>
            <SelectItem value="documents">Document Analytics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Employee Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.employeeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="hires" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                <Area type="monotone" dataKey="terminations" stackId="1" stroke="#ef4444" fill="#ef4444" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.departmentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ department, count }) => `${department}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData?.departmentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.leaveAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.documentStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}