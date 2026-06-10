import { ArrowLeft, Edit, Building, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ImmigrationStatusBadge } from "./ImmigrationStatusBadge";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title_name: string;
  department_name: string;
  company_name: string;
  status: string;
  profile_photo_url?: string;
  immigration_status?: string;
  compliance_score?: number;
}

interface EmployeeDetailHeaderProps {
  employee: Employee;
  onEditClick: () => void;
}

export const EmployeeDetailHeader = ({ employee, onEditClick }: EmployeeDetailHeaderProps) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on-leave': return 'outline';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="relative overflow-hidden border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-50" />
      
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
            className="hover-scale bg-background/80 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          
          <Button
            onClick={onEditClick}
            size="sm"
            className="hover-scale bg-primary/90 text-primary-foreground"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="flex items-center space-x-8">
          {/* Large Profile Avatar */}
          <div className="relative">
            <Avatar className="h-36 w-36 ring-4 ring-primary/20 ring-offset-4 ring-offset-background hover-scale">
              <AvatarImage 
                src={employee.profile_photo_url} 
                alt={`${employee.first_name} ${employee.last_name}`} 
              />
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator dot */}
            <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full ring-4 ring-background ${
              employee.status === 'active' ? 'bg-green-500' : 
              employee.status === 'on-leave' ? 'bg-yellow-500' : 
              employee.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
            }`} />
          </div>

          {/* Employee Information */}
          <div className="flex-1 space-y-4">
            {/* Name and Title */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-scale-in">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-xl text-muted-foreground font-medium">
                {employee.job_title_name}
              </p>
            </div>

            {/* Status and Department */}
            <div className="flex items-center gap-4 flex-wrap">
              <Badge 
                variant={getStatusBadgeVariant(employee.status)} 
                className="px-3 py-1 text-sm font-medium hover-scale"
              >
                {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1)}
              </Badge>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span className="text-sm font-medium">{employee.department_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{employee.company_name}</span>
              </div>

              {employee.immigration_status && (
                <ImmigrationStatusBadge status={employee.immigration_status as any} />
              )}
            </div>

            {/* Employee Number and Compliance Score */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Employee #:</span>
                <span className="ml-2 font-mono">{employee.employee_number}</span>
              </div>
              
              {employee.compliance_score !== undefined && (
                <div>
                  <span className="font-medium">Compliance Score:</span>
                  <span className={`ml-2 font-bold ${
                    employee.compliance_score >= 80 ? 'text-green-600' :
                    employee.compliance_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {employee.compliance_score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};