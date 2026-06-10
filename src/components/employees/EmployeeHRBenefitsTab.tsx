import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeePayslipsTab } from "./EmployeePayslipsTab";
import { EmployeeLeavesTab } from "./EmployeeLeavesTab";
import { EmployeeFinancialTab } from "./EmployeeFinancialTab";
import { Receipt, Calendar, CreditCard } from "lucide-react";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  salary?: number;
}

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

interface EmployeeBankDetails {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  bank_address?: string;
  currency_code?: string;
  verification_status?: string;
  verified_at?: string;
  verified_by?: string;
  is_primary: boolean;
  is_active: boolean;
}

interface EmployeeHRBenefitsTabProps {
  employee: Employee;
  employeeId: string;
  bankDetails: EmployeeBankDetails[];
  leaveBalances: LeaveBalance[];
  canManage: boolean;
  onBankDetailsUpdate?: () => void;
  onLeaveUpdate?: () => void;
  onPayslipUpdate?: () => void;
}

export const EmployeeHRBenefitsTab = ({ 
  employee,
  employeeId,
  bankDetails,
  leaveBalances,
  canManage,
  onBankDetailsUpdate,
  onLeaveUpdate,
  onPayslipUpdate
}: EmployeeHRBenefitsTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState("financial");

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="payslips" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Payslips
        </TabsTrigger>
        <TabsTrigger value="leaves" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Leaves
        </TabsTrigger>
        <TabsTrigger value="financial" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Banking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="payslips">
        <EmployeePayslipsTab 
          employeeId={employeeId} 
          onPayslipUpdate={onPayslipUpdate}
        />
      </TabsContent>

      <TabsContent value="leaves">
        <EmployeeLeavesTab 
          employeeId={employeeId} 
          leaveBalances={leaveBalances}
          onLeaveUpdate={onLeaveUpdate}
        />
      </TabsContent>

      <TabsContent value="financial">
        <EmployeeFinancialTab 
          employee={employee} 
          bankDetails={bankDetails}
          canManage={canManage}
          onBankDetailsUpdate={onBankDetailsUpdate}
        />
      </TabsContent>
    </Tabs>
  );
};