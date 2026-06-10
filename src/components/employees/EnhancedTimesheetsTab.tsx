import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimesheets, TimesheetEntry } from '@/hooks/useTimesheets';
import { usePermissions } from '@/hooks/usePermissions';
import { TimesheetModal } from '../timesheets/TimesheetModal';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Target,
  TrendingUp,
  Edit
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, addDays } from 'date-fns';

interface EnhancedTimesheetsTabProps {
  employeeId: string;
}

interface WeeklyData {
  weekStart: Date;
  weekEnd: Date;
  entries: TimesheetEntry[];
  totalHours: number;
  expectedHours: number;
  overtimeHours: number;
  status: 'no_entries' | 'under_hours' | 'on_target' | 'overtime';
}

export const EnhancedTimesheetsTab: React.FC<EnhancedTimesheetsTabProps> = ({ employeeId }) => {
  const { 
    entries, 
    stats, 
    loading, 
    fetchEntries, 
    fetchStats,
    refetch 
  } = useTimesheets();
  const { getTimesheetPermissions } = usePermissions();
  const permissions = getTimesheetPermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  useEffect(() => {
    if (employeeId) {
      fetchEntries({ employeeId });
      fetchStats(employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (entries.length > 0) {
      generateWeeklyData();
    }
  }, [entries]);

  const generateWeeklyData = () => {
    const now = new Date();
    const weeks = eachWeekOfInterval({
      start: subWeeks(now, 8), // Last 8 weeks
      end: now
    }, { weekStartsOn: 1 }); // Monday start

    const weekData: WeeklyData[] = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const totalHours = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const overtimeHours = weekEntries.reduce((sum, entry) => sum + entry.overtime_hours, 0);
      const expectedHours = 40; // Standard 40-hour work week

      let status: WeeklyData['status'] = 'no_entries';
      if (weekEntries.length > 0) {
        if (overtimeHours > 0 || totalHours > expectedHours) {
          status = 'overtime';
        } else if (totalHours >= expectedHours * 0.95) { // Within 5% of target
          status = 'on_target';
        } else {
          status = 'under_hours';
        }
      }

      return {
        weekStart,
        weekEnd,
        entries: weekEntries,
        totalHours,
        expectedHours,
        overtimeHours,
        status
      };
    });

    setWeeklyData(weekData.reverse()); // Most recent first
  };

  const getStatusColor = (status: WeeklyData['status']) => {
    switch (status) {
      case 'on_target':
        return 'text-success';
      case 'under_hours':
        return 'text-warning';
      case 'overtime':
        return 'text-info';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: WeeklyData['status']) => {
    switch (status) {
      case 'on_target':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'under_hours':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'overtime':
        return <TrendingUp className="h-4 w-4 text-info" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: WeeklyData['status']) => {
    switch (status) {
      case 'on_target':
        return <Badge variant="default" className="bg-success/10 text-success">On Target</Badge>;
      case 'under_hours':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Under Hours</Badge>;
      case 'overtime':
        return <Badge variant="outline" className="bg-info/10 text-info">Overtime</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">No Entries</Badge>;
    }
  };

  const handleEdit = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-primary">
                  {stats?.total_hours?.toFixed(1) || '0.0'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overtime Hours</p>
                <p className="text-3xl font-bold text-info">
                  {stats?.total_overtime?.toFixed(1) || '0.0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-info opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Daily Hours</p>
                <p className="text-3xl font-bold text-success">
                  {stats?.avg_daily_hours?.toFixed(1) || '0.0'}
                </p>
              </div>
              <Target className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Weekly Breakdown</h3>
          {permissions.canCreate && (
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>

        {weeklyData.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No timesheet data</h3>
              <p className="text-muted-foreground mb-4">
                No timesheet entries found for this employee.
              </p>
              {permissions.canCreate && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          weeklyData.map((week, index) => (
            <Card key={index} className="hover:bg-gradient-card/30 transition-all duration-300 border-0 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(week.status)}
                    <div>
                      <CardTitle className="text-base">
                        {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>
                        {week.totalHours.toFixed(1)}h of {week.expectedHours}h expected
                        {week.overtimeHours > 0 && (
                          <span className="ml-2 text-info font-medium">
                            (+{week.overtimeHours.toFixed(1)}h OT)
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(week.status)}
                </div>
              </CardHeader>

              {week.entries.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {week.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <p className="font-medium">{format(new Date(entry.date), 'EEE, MMM d')}</p>
                            <p className="text-muted-foreground">{entry.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right text-sm">
                            <p className="font-medium">{entry.hours}h</p>
                            {entry.overtime_hours > 0 && (
                              <p className="text-info text-xs">+{entry.overtime_hours}h OT</p>
                            )}
                          </div>
                          <Badge
                            variant={
                              entry.status === 'approved' ? 'default' :
                              entry.status === 'rejected' ? 'destructive' :
                              entry.status === 'submitted' ? 'secondary' : 'outline'
                            }
                            className="capitalize"
                          >
                            {entry.status}
                          </Badge>
                          {permissions.canUpdate && entry.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <TimesheetModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        entry={editingEntry}
      />
    </div>
  );
};