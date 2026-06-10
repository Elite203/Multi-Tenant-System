import { User, Briefcase, Phone } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeeOverviewTab } from "./EmployeeOverviewTab";
import { EmployeeWorkProfileTab } from "./EmployeeWorkProfileTab";
import { EmployeeEmergencyContactTab } from "./EmployeeEmergencyContactTab";
import { usePermissions } from "@/hooks/usePermissions";
import { LeaveBalance } from "@/types/employeeDocuments";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  date_of_birth: string;
  hire_date: string;
  start_date?: string;
  job_title_name: string;
  department_name: string;
  company_name: string;
  status: string;
  salary?: number;
  national_insurance_number?: string;
  immigration_status?: string;
  current_nationality_name?: string;
  sponsored_by_company_name?: string;
  compliance_score?: number;
  profile_photo_url?: string;
  profile_photo?: string;
  manager_id?: string;
  manager_name?: string;
  direct_reports_count?: number;
  employee_type?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  leave_balances?: LeaveBalance[];
}

interface PersonalWorkTabGroupProps {
  employee: Employee;
  onEmployeeUpdate: () => void;
}

export const PersonalWorkTabGroup = ({ employee, onEmployeeUpdate }: PersonalWorkTabGroupProps) => {
  const { getEmployeePermissions, canViewTeamStructure } = usePermissions();
  const employeePermissions = getEmployeePermissions();
  
  // Only show team structure info if user has permission AND the employee being viewed is a manager/director
  const isEmployeeManager = employee.employee_type === 'manager' || employee.employee_type === 'director';
  const shouldShowTeamInfo = canViewTeamStructure && isEmployeeManager;

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      icon: User,
      content: (
        <EmployeeOverviewTab 
          employee={{
            ...employee,
            employee_type: employee.employee_type || 'staff' as any,
            company_id: employee.company_id || '',
            created_at: employee.created_at || new Date().toISOString(),
            updated_at: employee.updated_at || new Date().toISOString(),
            profile_photo: employee.profile_photo || employee.profile_photo_url
          }}
          company={{ id: "1", name: employee.company_name }}
          manager={employee.manager_name ? { 
            id: employee.manager_id!, 
            first_name: employee.manager_name.split(' ')[0] || '', 
            last_name: employee.manager_name.split(' ')[1] || '',
            employee_number: 'N/A'
          } : undefined}
          directReportsCount={employee.direct_reports_count || 0}
          leaveBalances={employee.leave_balances || []}
          canManage={shouldShowTeamInfo}
        />
      )
    },
    {
      value: "work-profile",
      label: "Work Profile",
      icon: Briefcase,
      content: (
        <EmployeeWorkProfileTab 
          employeeId={employee.id}
        />
      )
    },
    {
      value: "emergency-contact",
      label: "Emergency Contact",
      icon: Phone,
      content: (
        <EmployeeEmergencyContactTab 
          employeeId={employee.id}
          onUpdate={onEmployeeUpdate}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="overview" />;
};