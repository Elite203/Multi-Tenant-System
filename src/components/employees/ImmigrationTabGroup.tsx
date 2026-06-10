import { Shield, Award, CreditCard as Visa, BookOpen } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeeRTWTab } from "./EmployeeRTWTab";
import { EmployeeCOSTab } from "./EmployeeCOSTab";
import { EmployeeVisaTab } from "./EmployeeVisaTab";
import { EmployeePassportTab } from "./EmployeePassportTab";
import { usePermissions } from "@/hooks/usePermissions";
import {
  RTWDocument,
  COSDocument,
  VisaDocument,
  PassportDocument
} from "@/types/employeeDocuments";

interface Employee {
  id: string;
  rtw_documents?: RTWDocument[];
  cos_documents?: COSDocument[];
  visas?: VisaDocument[];
  passports?: PassportDocument[];
}

interface ImmigrationTabGroupProps {
  employee: Employee;
  onEmployeeUpdate: () => void;
}

export const ImmigrationTabGroup = ({ employee, onEmployeeUpdate }: ImmigrationTabGroupProps) => {
  const { getRTWPermissions, getCOSPermissions, getVisaPermissions, getPassportPermissions } = usePermissions();
  const rtwPermissions = getRTWPermissions();
  const cosPermissions = getCOSPermissions();
  const visaPermissions = getVisaPermissions();
  const passportPermissions = getPassportPermissions();

  const tabs = [
    {
      value: "rtw",
      label: "Right to Work",
      icon: Shield,
      content: (
        <EmployeeRTWTab 
          employeeId={employee.id}
          rtwDocuments={employee.rtw_documents || [] as any}
          onUpdate={onEmployeeUpdate}
        />
      )
    },
    {
      value: "cos",
      label: "COS",
      icon: Award,
      content: (
        <EmployeeCOSTab 
          employeeId={employee.id}
          cosDocuments={employee.cos_documents || [] as any}
          onUpdate={onEmployeeUpdate}
        />
      )
    },
    {
      value: "visa",
      label: "Visa",
      icon: Visa,
      content: (
        <EmployeeVisaTab 
          employeeId={employee.id}
          visas={employee.visas || [] as any}
          onUpdate={onEmployeeUpdate}
        />
      )
    },
    {
      value: "passport",
      label: "Passport",
      icon: BookOpen,
      content: (
        <EmployeePassportTab 
          employeeId={employee.id}
          passports={employee.passports || [] as any}
          onUpdate={onEmployeeUpdate}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="rtw" />;
};