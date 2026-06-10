import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, Calendar } from 'lucide-react';
import { UserProfile } from '@/types/profile';
import { format } from 'date-fns';

interface EmployeeDetails {
  department_name?: string;
  job_title_name?: string;
  start_date?: string;
  company_name?: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface EmploymentDetailsCardProps {
  profile: UserProfile;
  isEditing: boolean;
}

export const EmploymentDetailsCard = ({ 
  profile, 
  isEditing 
}: EmploymentDetailsCardProps) => {
  const employeeDetails = {
    department_name: profile?.department_name,
    job_title_name: profile?.job_title_name,
    start_date: profile?.start_date,
    company_name: profile?.company_name,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };


  return (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Employment Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Department */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>Department</span>
          </Label>
          <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-foreground border">
            {employeeDetails.department_name || 'Not available'}
          </div>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Position</span>
          </Label>
          <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-foreground border">
            {employeeDetails.job_title_name || 'Not available'}
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Start Date</span>
          </Label>
          <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-foreground border">
            {formatDate(employeeDetails.start_date)}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};