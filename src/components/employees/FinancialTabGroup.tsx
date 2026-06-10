import { Receipt, CreditCard } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeePayslipsTab } from "./EmployeePayslipsTab";
import { EmployeeBankDetailsTab } from "./EmployeeBankDetailsTab";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id: string;
  bank_details?: BankDetails[];
}

interface BankDetails {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  currency_code?: string;
  verification_status?: string;
  is_primary: boolean;
  is_active: boolean;
}

interface FinancialTabGroupProps {
  employee: Employee;
  onEmployeeUpdate: () => void;
}

export const FinancialTabGroup = ({ employee, onEmployeeUpdate }: FinancialTabGroupProps) => {
  const { getPayslipPermissions, getFinancialPermissions } = usePermissions();
  const payslipPermissions = getPayslipPermissions();
  const financialPermissions = getFinancialPermissions();

  const tabs = [
    {
      value: "payslips",
      label: "Payslips",
      icon: Receipt,
      content: (
        <EmployeePayslipsTab 
          employeeId={employee.id}
        />
      )
    },
    {
      value: "bank-details",
      label: "Bank Details",
      icon: CreditCard,
      content: (
        <EmployeeBankDetailsTab 
          employeeId={employee.id}
          bankDetails={employee.bank_details || []}
          onUpdate={onEmployeeUpdate}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="payslips" />;
};