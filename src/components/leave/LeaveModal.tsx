import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface LeaveRequest {
  id?: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: string;
}

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveRequest?: LeaveRequest | null;
  preselectedEmployeeId?: string;
}

export const LeaveModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  leaveRequest,
  preselectedEmployeeId
}: LeaveModalProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  const { getLeavePermissions } = usePermissions();
  const permissions = getLeavePermissions();

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: '',
    reason: '',
    status: 'pending' as string,
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'bereavement', label: 'Bereavement Leave' },
    { value: 'personal', label: 'Personal Leave' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      if (leaveRequest) {
        setFormData({
          employee_id: leaveRequest.employee_id,
          leave_type: leaveRequest.leave_type,
          reason: leaveRequest.reason || '',
          status: leaveRequest.status,
        });
        setStartDate(new Date(leaveRequest.start_date));
        setEndDate(new Date(leaveRequest.end_date));
      } else {
        setFormData({
          employee_id: preselectedEmployeeId || '',
          leave_type: '',
          reason: '',
          status: 'pending',
        });
        setStartDate(undefined);
        setEndDate(undefined);
      }
    }
  }, [isOpen, leaveRequest, preselectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    }
  };

  const calculateDaysBetween = (start: Date, end: Date): number => {
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return daysDiff;
  };

  const requestedDays = startDate && endDate ? calculateDaysBetween(startDate, endDate) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.leave_type || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const leaveData = {
        employee_id: formData.employee_id,
        leave_type: formData.leave_type as 'annual' | 'sick' | 'maternity' | 'paternity' | 'bereavement' | 'personal',
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        days_requested: requestedDays,
        reason: formData.reason || null,
        status: formData.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      };

      let error;
      if (leaveRequest?.id) {
        const { error: updateError } = await supabase
          .from('leave_requests')
          .update(leaveData)
          .eq('id', leaveRequest.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('leave_requests')
          .insert([leaveData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Leave request ${leaveRequest?.id ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving leave request:', error);
      toast({
        title: "Error",
        description: "Failed to save leave request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            📅 {leaveRequest?.id ? 'Edit Leave Request' : 'Request Leave'}
          </DialogTitle>
          <p className="text-muted-foreground">
            {leaveRequest?.id ? 'Update the leave request details' : 'Submit a new leave request for approval'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="employee_id" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee *
            </Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
              disabled={!permissions.canCreate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leave_type">Leave Type *</Label>
            <Select value={formData.leave_type} onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                      (startDate && date < startDate)
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && (
            <div className="rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border border-primary/20">
              <p className="text-sm font-medium">
                <strong>Total Days Requested:</strong> {requestedDays} days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From {format(startDate, "MMM dd, yyyy")} to {format(endDate, "MMM dd, yyyy")}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason for Leave</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason for the leave request"
              rows={3}
            />
          </div>

          {permissions.canUpdate && leaveRequest?.id && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow"
            >
              {loading ? 'Saving...' : (leaveRequest?.id ? 'Update Request' : 'Submit Request')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};