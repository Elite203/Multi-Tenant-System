import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeQuery } from '@/hooks/useEmployeeQuery';
import { CalendarIcon, Download, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportFromRotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportFromRotaModal: React.FC<ImportFromRotaModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { user } = useAuth();
  const { importFromRota } = useTimesheets();
  const { employees } = useEmployeeQuery();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<Date | undefined>(undefined);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ status: 'imported' | 'already_exists' | 'error' }[] | null>(null);

  const handleWeekSelect = (date: Date | undefined) => {
    if (date) {
      // Get the start of the week (Monday)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      setSelectedWeek(weekStart);
    } else {
      setSelectedWeek(undefined);
    }
  };

  const handleImport = async () => {
    if (!selectedEmployeeId || !selectedWeek) {
      return;
    }

    setIsImporting(true);
    try {
      const weekStartStr = format(selectedWeek, 'yyyy-MM-dd');
      const results = await importFromRota(selectedEmployeeId, weekStartStr);
      setImportResults(results);
      
      // Auto-close after successful import with delay
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setSelectedWeek(undefined);
    setImportResults(null);
    onClose();
  };

  const getWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Import from ROTA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week Selection */}
          <div className="space-y-2">
            <Label>Select Week</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedWeek && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedWeek ? getWeekRange(selectedWeek) : "Pick a week"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedWeek}
                  onSelect={handleWeekSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will import all completed ROTA shifts for the selected week as draft timesheet entries.
              Existing entries for the same dates will not be overwritten.
            </AlertDescription>
          </Alert>

          {/* Import Results */}
          {importResults && (
            <Alert className="bg-success/10 border-success">
              <AlertDescription>
                Import completed! {importResults.filter(r => r.status === 'imported').length} new entries imported,{' '}
                {importResults.filter(r => r.status === 'already_exists').length} already existed.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedEmployeeId || !selectedWeek || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import ROTA Shifts'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};