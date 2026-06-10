import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertTriangle, Save, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface ShiftType {
  id: string;
  name: string;
  color?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: any;
  onSave: () => void;
}

export function ShiftManagementModal({ isOpen, onClose, shift, onSave }: ShiftManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    shift_type_id: '',
    location_id: '',
    department_id: '',
    date: '',
    start_time: '',
    end_time: '',
    status: 'scheduled' as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
    break_minutes: 0,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (shift) {
      setFormData({
        employee_id: shift.employee_id || '',
        shift_type_id: shift.shift_type_id || '',
        location_id: shift.location_id || '',
        department_id: shift.department_id || '',
        date: shift.date || '',
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        status: (shift.status || 'scheduled') as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
        break_minutes: shift.break_minutes || 0,
        notes: shift.notes || ''
      });
    } else {
      setFormData({
        employee_id: '',
        shift_type_id: '',
        location_id: '',
        department_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00',
        status: 'scheduled' as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
        break_minutes: 30,
        notes: ''
      });
    }
  }, [shift]);

  const loadFormData = async () => {
    try {
      const [employeesRes, shiftTypesRes, locationsRes, departmentsRes] = await Promise.all([
        supabase.from('employees').select('id, first_name, last_name, department').eq('status', 'active'),
        supabase.from('rota_shift_types').select('*').eq('is_active', true),
        supabase.from('rota_locations').select('*').eq('is_active', true),
        supabase.from('departments').select('*').eq('is_active', true)
      ]);

      if (employeesRes.data) setEmployees(employeesRes.data);
      if (shiftTypesRes.data) setShiftTypes(shiftTypesRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      if (departmentsRes.data) setDepartments(departmentsRes.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const checkConflicts = async () => {
    if (!formData.employee_id || !formData.date || !formData.start_time || !formData.end_time) {
      setConflicts([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('rota_shifts')
        .select('*')
        .eq('employee_id', formData.employee_id)
        .eq('date', formData.date)
        .neq('id', shift?.id || '')
        .not('status', 'eq', 'cancelled');

      const currentStart = new Date(`2000-01-01T${formData.start_time}`);
      const currentEnd = new Date(`2000-01-01T${formData.end_time}`);

      const conflictingShifts = data?.filter(existingShift => {
        const existingStart = new Date(`2000-01-01T${existingShift.start_time}`);
        const existingEnd = new Date(`2000-01-01T${existingShift.end_time}`);
        
        return (currentStart < existingEnd && currentEnd > existingStart);
      });

      setConflicts(conflictingShifts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  useEffect(() => {
    checkConflicts();
  }, [formData.employee_id, formData.date, formData.start_time, formData.end_time]);

  const handleSave = async () => {
    if (conflicts.length > 0) {
      toast({
        title: "Cannot save shift",
        description: "Please resolve conflicts before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const shiftData = {
        ...formData,
        break_minutes: parseInt(formData.break_minutes.toString()) || 0
      };

      if (shift) {
        const { error } = await supabase
          .from('rota_shifts')
          .update(shiftData)
          .eq('id', shift.id);

        if (error) throw error;
        
        toast({
          title: "Shift updated",
          description: "The shift has been successfully updated.",
        });
      } else {
        const { error } = await supabase
          .from('rota_shifts')
          .insert(shiftData);

        if (error) throw error;
        
        toast({
          title: "Shift created",
          description: "A new shift has been successfully created.",
        });
      }

      onSave();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save shift",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            {shift ? 'Edit Shift' : 'Create New Shift'}
          </DialogTitle>
          <DialogDescription>
            {shift ? 'Modify the shift details below' : 'Fill in the details to create a new shift'}
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Conflict detected:</strong> This employee has {conflicts.length} overlapping shift(s) on this date.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee: Employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time *</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time *</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            />
          </div>

          {/* Shift Type */}
          <div className="space-y-2">
            <Label htmlFor="shift_type">Shift Type *</Label>
            <Select value={formData.shift_type_id} onValueChange={(value) => setFormData({...formData, shift_type_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                {shiftTypes.map((type: ShiftType) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Break Minutes */}
          <div className="space-y-2">
            <Label htmlFor="break_minutes">Break Time (minutes)</Label>
            <Input
              type="number"
              value={formData.break_minutes}
              onChange={(e) => setFormData({...formData, break_minutes: parseInt(e.target.value) || 0})}
              min="0"
              max="480"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional notes about this shift..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || conflicts.length > 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}