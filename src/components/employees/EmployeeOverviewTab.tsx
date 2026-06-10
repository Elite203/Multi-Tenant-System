import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, CreditCard, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  job_title_name?: string;
  department?: string;
  department_name?: string;
  hire_date: string;
  start_date?: string;
  employee_type: string;
  status: string;
  address?: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  date_of_birth?: string;
  manager_id?: string;
  company_id: string;
  salary?: number;
  national_insurance_number?: string;
  immigration_status?: string;
  compliance_score?: number;
  user_id?: string;
  profile_photo?: string;
  profile_photo_url?: string;
  current_nationality_id?: string;
  current_nationality_name?: string;
  sponsored_by_company_id?: string;
  sponsored_by_company_name?: string;
  leave_entitlement?: number;
  remaining_leaves?: number;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  company_code?: string;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  employee_number: string;
}

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
}

interface EmployeeOverviewTabProps {
  employee: Employee;
  company: Company | null;
  manager: Manager | null;
  directReportsCount: number;
  leaveBalances: LeaveBalance[];
  canManage: boolean;
}

export const EmployeeOverviewTab = ({
  employee,
  company,
  manager,
  directReportsCount,
  leaveBalances,
  canManage
}: EmployeeOverviewTabProps) => {
  const remainingLeave = leaveBalances.reduce((total, balance) => {
    return total + (balance.allocated_days + balance.carried_over_days - balance.used_days);
  }, 0);

  const yearsOfService = Math.floor(
    (new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  // Format address from separate fields
  const formatAddress = () => {
    if (employee.address) return employee.address;
    
    const parts = [];
    if (employee.street_address) parts.push(employee.street_address);
    if (employee.address_line_2) parts.push(employee.address_line_2);
    if (employee.city) parts.push(employee.city);
    if (employee.state_province) parts.push(employee.state_province);
    if (employee.postal_code) parts.push(employee.postal_code);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Overview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Key Information */}
        <Card className="shadow-elegant hover:shadow-hero">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              Key Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
                <p className="mt-1 font-medium">#{employee.employee_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="mt-1">{employee.job_title_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="mt-1">{employee.department_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Type</label>
                <p className="mt-1 capitalize">{employee.employee_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                <p className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(employee.hire_date).toLocaleDateString()}
                </p>
              </div>
              {employee.start_date && employee.start_date !== employee.hire_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(employee.start_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {employee.date_of_birth && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(employee.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {employee.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="mt-1">{employee.phone}</p>
                </div>
              )}
              {employee.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1">{employee.email}</p>
                </div>
              )}
              {formatAddress() && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="mt-1">{formatAddress()}</p>
                </div>
              )}
              {canManage && employee.national_insurance_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">National Insurance Number</label>
                  <p className="mt-1">{employee.national_insurance_number}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <p className="mt-1">
                  {company && (
                    <Link to={`/companies/${company.id}`} className="text-primary hover:underline">
                      {company.name}
                    </Link>
                  )}
                </p>
              </div>
              {employee.immigration_status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Immigration Status</label>
                  <Badge variant="outline" className="mt-1">
                    {employee.immigration_status.replace('_', ' ')}
                  </Badge>
                </div>
              )}
              {employee.current_nationality_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                  <p className="mt-1">{employee.current_nationality_name}</p>
                </div>
              )}
              {canManage && employee.salary && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Salary</label>
                  <p className="mt-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    £{employee.salary.toLocaleString()}
                  </p>
                </div>
              )}
              {employee.sponsored_by_company_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sponsored By</label>
                  <p className="mt-1">{employee.sponsored_by_company_name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manager */}
        {manager && (
          <Card className="shadow-soft hover:shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-gradient-accent flex items-center justify-center">
                  <Users className="h-3 w-3 text-white" />
                </div>
                Reports To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to={`/employees/${manager.id}`}>
                <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs">
                        {manager.first_name.charAt(0)}{manager.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{manager.first_name} {manager.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {manager.job_title || 'Manager'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card className="shadow-soft hover:shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center">
                <CreditCard className="h-3 w-3 text-white" />
              </div>
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Years of Service</span>
              <span className="font-medium">{yearsOfService} years</span>
            </div>
            {canManage && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Direct Reports</span>
                <span className="font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {directReportsCount}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Leave Remaining</span>
              <Badge variant="outline">{employee.remaining_leaves || remainingLeave} days</Badge>
            </div>
            {employee.leave_entitlement && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Annual Entitlement</span>
                <span className="font-medium">{employee.leave_entitlement} days</span>
              </div>
            )}
            {employee.compliance_score !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Compliance Score</span>
                <Badge variant={employee.compliance_score >= 80 ? "default" : employee.compliance_score >= 60 ? "secondary" : "destructive"}>
                  {employee.compliance_score}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Balances */}
        {leaveBalances.length > 0 && (
          <Card className="shadow-soft hover:shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-gradient-accent flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-white" />
                </div>
                Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveBalances.map((balance) => (
                  <div key={balance.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium capitalize">{balance.leave_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {balance.used_days} used of {balance.allocated_days + balance.carried_over_days}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {balance.allocated_days + balance.carried_over_days - balance.used_days} days
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};