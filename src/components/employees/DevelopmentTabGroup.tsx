import { GraduationCap } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeeEducationTab } from "./EmployeeEducationTab";
import { usePermissions } from "@/hooks/usePermissions";
import { EducationRecord, CertificationRecord } from "@/types/employeeDocuments";

interface Employee {
  id: string;
  education?: EducationRecord[];
  certifications?: CertificationRecord[];
}

interface DevelopmentTabGroupProps {
  employee: Employee;
}

export const DevelopmentTabGroup = ({ employee }: DevelopmentTabGroupProps) => {
  const { getEducationPermissions, getCertificationPermissions, getTrainingPermissions } = usePermissions();
  const educationPermissions = getEducationPermissions();
  const certificationPermissions = getCertificationPermissions();
  const trainingPermissions = getTrainingPermissions();

  const tabs = [
    {
      value: "education",
      label: "Education",
      icon: GraduationCap,
      content: (
        <EmployeeEducationTab 
          employeeId={employee.id}
          education={employee.education || []}
          certifications={employee.certifications || []}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="education" />;
};