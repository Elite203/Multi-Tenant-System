import { FileText } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeeDocumentsTab } from "./EmployeeDocumentsTab";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id: string;
}

interface DocumentsTabGroupProps {
  employee: Employee;
  onEmployeeUpdate: () => void;
}

export const DocumentsTabGroup = ({ employee, onEmployeeUpdate }: DocumentsTabGroupProps) => {
  const { getDocumentPermissions } = usePermissions();
  const documentPermissions = getDocumentPermissions();

  const tabs = [
    {
      value: "documents",
      label: "Documents",
      icon: FileText,
      content: (
        <EmployeeDocumentsTab 
          employeeId={employee.id}
          onUpdate={onEmployeeUpdate}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="documents" />;
};