import { Calendar, Clock } from "lucide-react";
import { EmployeeTabGroup } from "./EmployeeTabGroup";
import { EmployeeLeavesTab } from "./EmployeeLeavesTab";
import { EnhancedTimesheetsTab } from "./EnhancedTimesheetsTab";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id: string;
  leave_balances?: LeaveBalance[];
}

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

interface TimeLeaveTabGroupProps {
  employee: Employee;
}

export const TimeLeaveTabGroup = ({ employee }: TimeLeaveTabGroupProps) => {
  const { getLeavePermissions, getTimesheetPermissions } = usePermissions();
  const leavePermissions = getLeavePermissions();
  const timesheetPermissions = getTimesheetPermissions();

  const tabs = [
    {
      value: "leaves",
      label: "Leaves",
      icon: Calendar,
      content: (
        <EmployeeLeavesTab 
          employeeId={employee.id}
          leaveBalances={employee.leave_balances || []}
        />
      )
    },
    {
      value: "timesheets",
      label: "Timesheets",
      icon: Clock,
      content: (
        <EnhancedTimesheetsTab 
          employeeId={employee.id}
        />
      )
    }
  ];

  return <EmployeeTabGroup tabs={tabs} defaultTab="leaves" />;
};