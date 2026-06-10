import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeProfessionalTab } from "./EmployeeProfessionalTab";
import { EmployeePersonalTab } from "./EmployeePersonalTab";
import { EmployeeWorkProfileTab } from "./EmployeeWorkProfileTab";
import { User, Briefcase, Building } from "lucide-react";
import { EmployeeWorkProfile } from "@/types/workProfile";

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
  salary?: number;
  profile_photo?: string;
  current_nationality_name?: string;
  sponsored_by_company_name?: string;
  immigration_status?: string;
  compliance_score?: number;
  address?: string;
  date_of_birth?: string;
  sex?: 'male' | 'female' | null;
}

interface EmployeeProfileCombinedTabProps {
  employee: Employee;
  workProfile?: EmployeeWorkProfile | null;
  onEmployeeUpdate?: () => void;
  onWorkProfileUpdate?: () => void;
}

export const EmployeeProfileCombinedTab = ({ 
  employee, 
  workProfile, 
  onEmployeeUpdate,
  onWorkProfileUpdate 
}: EmployeeProfileCombinedTabProps) => {
  const [activeTab, setActiveTab] = useState("professional");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="professional" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Professional
        </TabsTrigger>
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Personal
        </TabsTrigger>
        <TabsTrigger value="work-profile" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Work Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="professional">
        <EmployeeProfessionalTab employee={employee} />
      </TabsContent>

      <TabsContent value="personal">
        <EmployeePersonalTab employee={employee} onEmployeeUpdate={onEmployeeUpdate} />
      </TabsContent>

      <TabsContent value="work-profile">
        <EmployeeWorkProfileTab 
          employeeId={employee.id} 
          workProfile={workProfile}
          onWorkProfileUpdate={onWorkProfileUpdate}
        />
      </TabsContent>
    </Tabs>
  );
};