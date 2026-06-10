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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
}

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  leaveRequest?: LeaveRequest | null;
  leaveBalances?: LeaveBalance[];
}

export const LeaveRequestForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  employeeId, 
  leaveRequest,
  leaveBalances = []
}: LeaveRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    leave_type: '',
    reason: '',
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'bereavement', label: 'Bereavement Leave' },
    { value: 'personal', label: 'Personal Leave' },
  ];

  useEffect(() => {
    if (isOpen) {
      if (leaveRequest) {
        setFormData({
          leave_type: leaveRequest.leave_type,
          reason: leaveRequest.reason || '',
        });
        setStartDate(new Date(leaveRequest.start_date));
        setEndDate(new Date(leaveRequest.end_date));
      } else {
        setFormData({
          leave_type: '',
          reason: '',
        });
        setStartDate(undefined);
        setEndDate(undefined);
      }
    }
  }, [isOpen, leaveRequest]);

  const calculateDaysBetween = (start: Date, end: Date): number => {
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    return daysDiff;
  };

  const getAvailableDays = (leaveType: string): number => {
    const balance = leaveBalances.find(b => b.leave_type === leaveType);
    if (!balance) return 0;
    return balance.allocated_days + balance.carried_over_days - balance.used_days;
  };

  const requestedDays = startDate && endDate ? calculateDaysBetween(startDate, endDate) : 0;
  const availableDays = formData.leave_type ? getAvailableDays(formData.leave_type) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leave_type || !startDate || !endDate) {
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

    // Check if there are enough available days (only for annual leave)
    if (formData.leave_type === 'annual' && requestedDays > availableDays) {
      toast({
        title: "Insufficient leave balance",
        description: `You only have ${availableDays} days available for ${formData.leave_type.replace('_', ' ')} leave`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const leaveData = {
        employee_id: employeeId,
        leave_type: formData.leave_type as 'annual' | 'sick' | 'maternity' | 'paternity' | 'bereavement' | 'personal',
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        days_requested: requestedDays,
        reason: formData.reason || null,
        status: 'pending' as 'pending' | 'approved' | 'rejected' | 'cancelled',
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
        description: `Leave request ${leaveRequest?.id ? 'updated' : 'submitted'} successfully`,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {leaveRequest?.id ? 'Edit Leave Request' : 'Request Leave'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {formData.leave_type && (
              <p className="text-sm text-muted-foreground mt-1">
                Available: {availableDays} days
              </p>
            )}
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
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                <strong>Days requested:</strong> {requestedDays} days
              </p>
              {formData.leave_type === 'annual' && (
                <p className={cn(
                  "text-sm",
                  requestedDays > availableDays ? "text-destructive" : "text-muted-foreground"
                )}>
                  <strong>Remaining after request:</strong> {availableDays - requestedDays} days
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason for leave request"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : (leaveRequest?.id ? 'Update' : 'Submit')} Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};