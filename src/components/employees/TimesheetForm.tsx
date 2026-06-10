import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";

interface TimesheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  timesheet?: {
    id: string;
    week_starting: string;
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
    status: string;
    notes?: string;
  };
}

export const TimesheetForm = ({ isOpen, onClose, onSave, employeeId, timesheet }: TimesheetFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Get current week start date
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState({
    week_starting: timesheet?.week_starting || currentWeekStart,
    monday_hours: 0,
    tuesday_hours: 0,
    wednesday_hours: 0,
    thursday_hours: 0,
    friday_hours: 0,
    saturday_hours: 0,
    sunday_hours: 0,
    status: timesheet?.status || "draft",
    notes: timesheet?.notes || "",
  });

  const calculateTotalHours = () => {
    return (
      formData.monday_hours +
      formData.tuesday_hours +
      formData.wednesday_hours +
      formData.thursday_hours +
      formData.friday_hours +
      formData.saturday_hours +
      formData.sunday_hours
    );
  };

  const calculateOvertimeHours = () => {
    const totalHours = calculateTotalHours();
    return totalHours > 40 ? totalHours - 40 : 0;
  };

  const calculateRegularHours = () => {
    const totalHours = calculateTotalHours();
    return totalHours > 40 ? 40 : totalHours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours();
      const regularHours = calculateRegularHours();
      const overtimeHours = calculateOvertimeHours();

      const payload = {
        employee_id: employeeId,
        week_starting: formData.week_starting,
        monday_hours: formData.monday_hours,
        tuesday_hours: formData.tuesday_hours,
        wednesday_hours: formData.wednesday_hours,
        thursday_hours: formData.thursday_hours,
        friday_hours: formData.friday_hours,
        saturday_hours: formData.saturday_hours,
        sunday_hours: formData.sunday_hours,
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (timesheet) {
        const { error } = await supabase
          .from("timesheets" as any)
          .update(payload)
          .eq("id", timesheet.id);
        
        if (error) throw error;
        toast({ title: "Timesheet updated successfully" });
      } else {
        const { error } = await supabase
          .from("timesheets" as any)
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Timesheet created successfully" });
      }

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const weekStartDate = new Date(formData.week_starting);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayFields = ['monday_hours', 'tuesday_hours', 'wednesday_hours', 'thursday_hours', 'friday_hours', 'saturday_hours', 'sunday_hours'] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {timesheet ? "Edit Timesheet" : "Add Timesheet"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="week_starting">Week Starting *</Label>
              <Input
                id="week_starting"
                type="date"
                value={formData.week_starting}
                onChange={(e) => setFormData({ ...formData, week_starting: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Daily Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {days.map((day, index) => {
                const fieldName = dayFields[index];
                const dayDate = addDays(weekStartDate, index);
                
                return (
                  <div key={day}>
                    <Label htmlFor={fieldName}>
                      {day}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({format(dayDate, 'MMM dd')})
                      </span>
                    </Label>
                    <Input
                      id={fieldName}
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData[fieldName]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [fieldName]: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-xl font-bold">{calculateTotalHours().toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Regular Hours</p>
              <p className="text-xl font-bold text-green-600">{calculateRegularHours().toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Overtime Hours</p>
              <p className="text-xl font-bold text-orange-600">{calculateOvertimeHours().toFixed(1)}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes about this timesheet..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Timesheet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};