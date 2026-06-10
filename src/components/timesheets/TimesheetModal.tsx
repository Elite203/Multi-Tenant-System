import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTimesheets, TimesheetEntry } from '@/hooks/useTimesheets';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const timesheetSchema = z.object({
  date: z.string().min(1, "Date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  break_minutes: z.number().min(0).max(480),
  hours: z.number().min(0.1, "Hours must be at least 0.1").max(24, "Hours cannot exceed 24"),
  overtime_hours: z.number().min(0).max(24),
  description: z.string().min(5, "Description must be at least 5 characters"),
  notes: z.string().optional(),
  status: z.enum(['draft', 'submitted'])
});

interface TimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: TimesheetEntry | null;
}

export const TimesheetModal: React.FC<TimesheetModalProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const { user } = useAuth();
  const { createEntry, updateEntry } = useTimesheets();
  const { getTimesheetPermissions } = usePermissions();
  const permissions = getTimesheetPermissions();

  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    break_minutes: 0,
    hours: 0,
    overtime_hours: 0,
    description: '',
    notes: '',
    status: 'draft' as 'draft' | 'submitted'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        start_time: entry.start_time || '',
        end_time: entry.end_time || '',
        break_minutes: entry.break_minutes || 0,
        hours: entry.hours || 0,
        overtime_hours: entry.overtime_hours || 0,
        description: entry.description || '',
        notes: entry.notes || '',
        status: entry.status as 'draft' | 'submitted'
      });
      setSelectedDate(new Date(entry.date));
    } else {
      // Reset form for new entry
      setFormData({
        date: '',
        start_time: '',
        end_time: '',
        break_minutes: 0,
        hours: 0,
        overtime_hours: 0,
        description: '',
        notes: '',
        status: 'draft'
      });
      setSelectedDate(undefined);
    }
    setErrors({});
  }, [entry, isOpen]);

  const calculateHours = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const breakHours = formData.break_minutes / 60;
      const totalHours = Math.max(0, diffHours - breakHours);
      
      setFormData(prev => ({
        ...prev,
        hours: Math.round(totalHours * 100) / 100
      }));
    }
  };

  useEffect(() => {
    calculateHours();
  }, [formData.start_time, formData.end_time, formData.break_minutes]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const handleInputChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    try {
      timesheetSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (entry) {
        await updateEntry(entry.id, formData);
      } else {
        await createEntry(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Edit Timesheet Entry' : 'Create Timesheet Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>
          </div>

          {/* Break and Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="break_minutes">Break (minutes)</Label>
              <Input
                type="number"
                min="0"
                max="480"
                value={formData.break_minutes}
                onChange={(e) => handleInputChange('break_minutes', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Hours *</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="24"
                value={formData.hours}
                onChange={(e) => handleInputChange('hours', parseFloat(e.target.value) || 0)}
              />
              {errors.hours && <p className="text-sm text-destructive">{errors.hours}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime_hours">Overtime Hours</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={formData.overtime_hours}
                onChange={(e) => handleInputChange('overtime_hours', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the work performed..."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Status Selection */}
          {permissions.canSubmit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};