import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, RefreshCw, Calculator } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FiscalYearSettingsProps {
  fiscalYearStart: Date;
  onFiscalYearUpdate: (date: Date) => void;
  isUpdating: boolean;
}

export function FiscalYearSettings({ fiscalYearStart, onFiscalYearUpdate, isUpdating }: FiscalYearSettingsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(fiscalYearStart);
  const [recalculating, setRecalculating] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeCount();
  }, []);

  const fetchEmployeeCount = async () => {
    try {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      setEmployeeCount(count || 0);
    } catch (error) {
      console.error('Error fetching employee count:', error);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      
      const { data, error } = await supabase
        .rpc('recalculate_all_leave_entitlements');

      if (error) throw error;

      toast({
        title: "Success",
        description: `Recalculated leave entitlements for ${data} employees`,
      });
    } catch (error) {
      console.error('Error recalculating leaves:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate leave entitlements",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = () => {
    onFiscalYearUpdate(selectedDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Fiscal Year & Leave Calculation
        </CardTitle>
        <CardDescription>
          Configure fiscal year start date and manage automatic leave entitlement calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fiscal Year Start Date</label>
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
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              This date determines how pro-rata leave entitlements are calculated for new employees
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isUpdating || selectedDate.getTime() === fiscalYearStart.getTime()}
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Update Fiscal Year"}
          </Button>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Leave Calculation Management
          </h4>
          
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How Pro-Rata Calculation Works:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Employees hired before fiscal year start: Full allocation</li>
                  <li>• Mid-year joiners: Pro-rata based on remaining days in fiscal year</li>
                  <li>• Calculation: (Default Days × Remaining Days) ÷ Total Days</li>
                  <li>• Updates automatically when hire dates or allocations change</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Employees</span>
                <span className="text-sm text-muted-foreground">{employeeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Fiscal Year</span>
                <span className="text-sm text-muted-foreground">
                  {format(fiscalYearStart, "MMM yyyy")} - {format(new Date(fiscalYearStart.getFullYear() + 1, fiscalYearStart.getMonth(), fiscalYearStart.getDate() - 1), "MMM yyyy")}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleRecalculateAll}
              disabled={recalculating || employeeCount === 0}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", recalculating && "animate-spin")} />
              {recalculating ? "Recalculating..." : "Recalculate All Leave Entitlements"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              This will recalculate leave entitlements for all active employees based on current settings.
              Use this after changing leave allocation policies or fiscal year dates.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}