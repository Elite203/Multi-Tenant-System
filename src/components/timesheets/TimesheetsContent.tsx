import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimesheets, TimesheetEntry, TimesheetFilters } from '@/hooks/useTimesheets';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { TimesheetModal } from './TimesheetModal';
import { ImportFromRotaModal } from './ImportFromRotaModal';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Download,
  Upload,
  Edit,
  Check,
  X,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

export const TimesheetsContent: React.FC = () => {
  const { user } = useAuth();
  const { 
    entries, 
    stats, 
    loading, 
    fetchEntries, 
    updateEntry, 
    approveEntry, 
    rejectEntry,
    submitEntry,
    refetch 
  } = useTimesheets();
  const { getTimesheetPermissions } = usePermissions();
  const permissions = getTimesheetPermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [filters, setFilters] = useState<TimesheetFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key: keyof TimesheetFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchEntries(newFilters);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const newFilters = { ...filters, search: term };
    setFilters(newFilters);
    fetchEntries(newFilters);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      case 'submitted':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleApprove = async (entry: TimesheetEntry) => {
    try {
      await approveEntry(entry.id);
      refetch();
    } catch (error) {
      console.error('Error approving entry:', error);
    }
  };

  const handleReject = async (entry: TimesheetEntry) => {
    try {
      await rejectEntry(entry.id);
      refetch();
    } catch (error) {
      console.error('Error rejecting entry:', error);
    }
  };

  const handleSubmit = async (entry: TimesheetEntry) => {
    try {
      await submitEntry(entry.id);
      refetch();
    } catch (error) {
      console.error('Error submitting entry:', error);
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

  const handleImportComplete = () => {
    setIsImportModalOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-hero p-8 rounded-xl shadow-hero text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Timesheets</h1>
            <p className="text-xl opacity-90">Track your working hours and time</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsImportModalOpen(true)}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import from Rota
            </Button>
            {permissions.canCreate && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-sm text-muted-foreground mb-1">Weekly Target</p>
                <p className="text-3xl font-bold text-success">
                  {stats?.weekly_target || 40}h
                </p>
              </div>
              <Target className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Entries</p>
                <p className="text-3xl font-bold text-info">
                  {stats?.approved_entries || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-info opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Entries</p>
                <p className="text-3xl font-bold text-warning">
                  {stats?.pending_entries || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search timesheet entries..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entry List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No timesheet entries found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first timesheet entry or importing from ROTA.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Create Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="hover:bg-gradient-card/50 transition-all duration-300 border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(entry.status)}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium">{format(new Date(entry.date), 'EEE, MMM d, yyyy')}</p>
                        {entry.start_time && entry.end_time && (
                          <span className="text-sm text-muted-foreground">
                            {entry.start_time} - {entry.end_time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusBadgeVariant(entry.status)} className="capitalize">
                          {entry.status}
                        </Badge>
                        <span className="text-sm font-medium">{entry.hours}h</span>
                        {entry.overtime_hours > 0 && (
                          <span className="text-sm text-warning font-medium">
                            +{entry.overtime_hours}h OT
                          </span>
                        )}
                        {entry.break_minutes > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Break: {entry.break_minutes}min
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {permissions.canUpdate && entry.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(entry)}
                        >
                          Submit
                        </Button>
                      </>
                    )}
                    
                    {permissions.canApprove && entry.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(entry)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(entry)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <TimesheetModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        entry={editingEntry}
      />
      
      <ImportFromRotaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};