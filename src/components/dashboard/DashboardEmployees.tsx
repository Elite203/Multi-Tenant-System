import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDashboardEmployees } from "@/hooks/useDashboardEmployees";
import { Search, Filter, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const DashboardEmployees = () => {
  const { employees, loading } = useDashboardEmployees();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="lg:col-span-2 border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Employees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Employees
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {
                if (employee.id && employee.id !== 'null') {
                  console.log('Navigating to employee:', employee.id);
                  navigate(`/employees/${employee.id}`);
                } else {
                  console.error('Invalid employee ID for navigation:', employee.id);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">{employee.first_name} {employee.last_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {employee.job_title_name} • {employee.department_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {employee.email} • {employee.employee_number}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={employee.status === 'active' ? 'default' : 'secondary'}
                  className="mb-1"
                >
                  {employee.status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Hired: {new Date(employee.hire_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/employees')}
          >
            View All Employees
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};