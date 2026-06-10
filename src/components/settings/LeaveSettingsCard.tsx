import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator } from "lucide-react";
import { useState } from "react";

interface LeaveSettingsCardProps {
  getSetting: (key: string) => string;
  updateSetting: (key: string, value: string) => void;
  isUpdating: boolean;
}

export function LeaveSettingsCard({ getSetting, updateSetting, isUpdating }: LeaveSettingsCardProps) {
  const [localSettings, setLocalSettings] = useState({
    default_annual_leave_days: getSetting('default_annual_leave_days'),
    leave_carry_over_limit: getSetting('leave_carry_over_limit'),
    leave_approval_workflow: getSetting('leave_approval_workflow'),
    leave_notice_period_days: getSetting('leave_notice_period_days'),
    probation_leave_entitlement: getSetting('probation_leave_entitlement'),
  });

  const workflowOptions = [
    { value: 'manager_only', label: 'Manager Only' },
    { value: 'hr_approval', label: 'HR Approval' },
    { value: 'manager_then_hr', label: 'Manager then HR' }
  ];

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Settings</CardTitle>
        <CardDescription>
          Configure leave allocations, approval workflows, and policies. Leave entitlements are now calculated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription>
            <strong>Automatic Leave Calculation:</strong> Employee leave entitlements are now calculated automatically 
            based on hire date and fiscal year settings. These settings apply to new leave allocations.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="default_annual_leave_days">Default Annual Leave (Days)</Label>
            <Input
              id="default_annual_leave_days"
              type="number"
              min="0"
              max="365"
              value={localSettings.default_annual_leave_days}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, default_annual_leave_days: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave_carry_over_limit">Carry Over Limit (Days)</Label>
            <Input
              id="leave_carry_over_limit"
              type="number"
              min="0"
              max="50"
              value={localSettings.leave_carry_over_limit}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, leave_carry_over_limit: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave_notice_period_days">Notice Period (Days)</Label>
            <Input
              id="leave_notice_period_days"
              type="number"
              min="1"
              max="90"
              value={localSettings.leave_notice_period_days}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, leave_notice_period_days: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="probation_leave_entitlement">Probation Leave Entitlement (Days)</Label>
            <Input
              id="probation_leave_entitlement"
              type="number"
              min="0"
              max="25"
              value={localSettings.probation_leave_entitlement}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, probation_leave_entitlement: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leave_approval_workflow">Approval Workflow</Label>
          <Select 
            value={localSettings.leave_approval_workflow} 
            onValueChange={(value) => setLocalSettings(prev => ({ ...prev, leave_approval_workflow: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflowOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Leave Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}