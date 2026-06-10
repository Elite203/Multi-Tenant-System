import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  Shield, 
  CreditCard, 
  GraduationCap, 
  FileText
} from "lucide-react";

// Import tab group components
import { PersonalWorkTabGroup } from "./PersonalWorkTabGroup";
import { TimeLeaveTabGroup } from "./TimeLeaveTabGroup";
import { ImmigrationTabGroup } from "./ImmigrationTabGroup";
import { FinancialTabGroup } from "./FinancialTabGroup";
import { DevelopmentTabGroup } from "./DevelopmentTabGroup";
import { DocumentsTabGroup } from "./DocumentsTabGroup";
import {
  PassportDocument,
  VisaDocument,
  RTWDocument,
  COSDocument,
  BankDetail,
  CertificationRecord,
  TrainingRecord,
  EducationRecord,
  LeaveBalance
} from "@/types/employeeDocuments";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
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
  manager_id?: string;
  manager_name?: string;
  direct_reports_count?: number;
  // Database compatibility fields
  employee_type?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  // Related data arrays
  passports?: PassportDocument[];
  visas?: VisaDocument[];
  rtw_documents?: RTWDocument[];
  cos_documents?: COSDocument[];
  bank_details?: BankDetail[];
  certifications?: CertificationRecord[];
  training?: TrainingRecord[];
  education?: EducationRecord[];
  leave_balances?: LeaveBalance[];
}

interface EmployeeTabsContainerProps {
  employee: Employee;
  onEmployeeUpdate: () => void;
}

export const EmployeeTabsContainer = ({ employee, onEmployeeUpdate }: EmployeeTabsContainerProps) => {
  const [activeTabGroup, setActiveTabGroup] = useState("personal-work");

  const tabGroups = [
    {
      value: "personal-work",
      label: "Personal & Work",
      icon: Users,
      content: (
        <PersonalWorkTabGroup 
          employee={employee} 
          onEmployeeUpdate={onEmployeeUpdate} 
        />
      )
    },
    {
      value: "time-leave",
      label: "Time & Leave",
      icon: Calendar,
      content: (
        <TimeLeaveTabGroup 
          employee={employee} 
        />
      )
    },
    {
      value: "immigration",
      label: "Immigration & Compliance",
      icon: Shield,
      content: (
        <ImmigrationTabGroup 
          employee={employee} 
          onEmployeeUpdate={onEmployeeUpdate} 
        />
      )
    },
    {
      value: "financial",
      label: "Financial",
      icon: CreditCard,
      content: (
        <FinancialTabGroup 
          employee={employee} 
          onEmployeeUpdate={onEmployeeUpdate} 
        />
      )
    },
    {
      value: "development",
      label: "Development",
      icon: GraduationCap,
      content: (
        <DevelopmentTabGroup 
          employee={employee} 
        />
      )
    },
    {
      value: "documents",
      label: "Documents",
      icon: FileText,
      content: (
        <DocumentsTabGroup 
          employee={employee} 
          onEmployeeUpdate={onEmployeeUpdate} 
        />
      )
    }
  ];

  return (
    <div className="w-full animate-fade-in">
      <Tabs value={activeTabGroup} onValueChange={setActiveTabGroup} className="w-full">
        <TabsList className="w-full">
          {tabGroups.map((group) => {
            const IconComponent = group.icon;
            return (
              <TabsTrigger
                key={group.value}
                value={group.value}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:block">{group.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          {tabGroups.map((group) => (
            <TabsContent key={group.value} value={group.value} className="mt-0">
              {group.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};