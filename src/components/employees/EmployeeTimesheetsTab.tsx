import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, TrendingUp, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { TimesheetForm } from "./TimesheetForm";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface TimesheetEntry {
  id: string;
  week_starting: string;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: string;
  approved_by?: string;
  approved_at?: string;
  submitted_at?: string;
  notes?: string;
}

interface EmployeeTimesheetsTabProps {
  employeeId: string;
}

export const EmployeeTimesheetsTab = ({ employeeId }: EmployeeTimesheetsTabProps) => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetEntry | undefined>();
  const { toast } = useToast();
  const { getTimesheetPermissions } = usePermissions();
  const permissions = getTimesheetPermissions();

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('timesheets' as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('week_starting', { ascending: false });

      if (error) throw error;
      setTimesheets((data || []) as unknown as TimesheetEntry[]);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error", 
        description: "Failed to load timesheets",
        variant: "destructive",
      });
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [employeeId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'default';
      case 'submitted': return 'outline';
      case 'draft': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const calculateStats = () => {
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.total_hours, 0);
    const totalOvertime = timesheets.reduce((sum, ts) => sum + ts.overtime_hours, 0);
    const avgWeeklyHours = timesheets.length > 0 ? totalHours / timesheets.length : 0;

    return { totalHours, totalOvertime, avgWeeklyHours };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAdd = () => {
    setEditingTimesheet(undefined);
    setShowForm(true);
  };

  const handleEdit = (timesheet: TimesheetEntry) => {
    setEditingTimesheet(timesheet);
    setShowForm(true);
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Timesheet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
                <p className="text-2xl font-bold">{stats.totalOvertime.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Weekly Hours</p>
                <p className="text-2xl font-bold">{stats.avgWeeklyHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Timesheets
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Timesheet
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No timesheet entries found</p>
              <p className="text-sm">Timesheet data will appear here once available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        Week of {format(new Date(timesheet.week_starting), 'MMM dd, yyyy')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(timesheet.week_starting), 'MMM dd')} - {' '}
                        {format(endOfWeek(new Date(timesheet.week_starting)), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(timesheet.status)}>
                        {timesheet.status}
                      </Badge>
                      {permissions.canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(timesheet)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Hours:</span>
                      <span className="ml-2 font-medium">{timesheet.total_hours}</span>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Regular:</span>
                      <span className="ml-2">{timesheet.regular_hours}</span>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Overtime:</span>
                      <span className="ml-2 text-orange-600 font-medium">{timesheet.overtime_hours}</span>
                    </div>
                    
                    {timesheet.approved_by && (
                      <div>
                        <span className="text-muted-foreground">Approved by:</span>
                        <span className="ml-2">{timesheet.approved_by}</span>
                      </div>
                    )}
                  </div>

                  {timesheet.notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                      <span className="text-muted-foreground font-medium">Notes:</span>
                      <p className="mt-1">{timesheet.notes}</p>
                    </div>
                  )}

                  {timesheet.submitted_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Submitted: {format(new Date(timesheet.submitted_at), 'MMM dd, yyyy h:mm a')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TimesheetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => {
          fetchTimesheets();
          setShowForm(false);
        }}
        employeeId={employeeId}
        timesheet={editingTimesheet}
      />
    </div>
  );
};