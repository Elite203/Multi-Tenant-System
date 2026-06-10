import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Building, Users } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  job_title_name?: string;
  department?: string;
  department_name?: string;
  hire_date: string;
  start_date?: string;
  employee_type: string;
  status: string;
  salary?: number;
  profile_photo?: string;
  current_nationality_name?: string;
  sponsored_by_company_name?: string;
  immigration_status?: string;
  compliance_score?: number;
}

interface EmployeeProfessionalTabProps {
  employee: Employee;
}

export const EmployeeProfessionalTab = ({ employee }: EmployeeProfessionalTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="text-lg">{employee.job_title_name || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-lg">{employee.department_name || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Type</label>
                <Badge variant="secondary">{employee.employee_type}</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(employee.hire_date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge className={employee.status === 'active' ? 'bg-green-500' : 'bg-secondary'}>
                  {employee.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
                <p className="font-mono">{employee.employee_number}</p>
              </div>
              {employee.start_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(employee.start_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
              )}
              {employee.immigration_status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Immigration Status</label>
                  <Badge variant="outline">
                    {employee.immigration_status.replace('_', ' ')}
                  </Badge>
                </div>
              )}
              {employee.current_nationality_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                  <p className="text-lg">{employee.current_nationality_name}</p>
                </div>
              )}
              {employee.sponsored_by_company_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sponsored By</label>
                  <p className="text-lg">{employee.sponsored_by_company_name}</p>
                </div>
              )}
              {employee.compliance_score !== undefined && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Compliance Score</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={employee.compliance_score >= 80 ? "default" : employee.compliance_score >= 60 ? "secondary" : "destructive"}>
                      {employee.compliance_score}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};