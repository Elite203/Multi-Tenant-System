import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Calendar, Eye, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, isThisQuarter } from "date-fns";
import { ImportJobDetailsModal } from "./ImportJobDetailsModal";
import { ImportHistoryFilters } from "./ImportHistoryFilters";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useSorting } from "@/hooks/useSorting";

interface ImportJob {
  id: string;
  filename: string;
  status: string;
  progress: number;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  warning_rows: number;
  created_at: string;
  completed_at: string | null;
  template: {
    display_name: string;
  };
}

interface FilterState {
  search: string;
  status: string;
  module: string;
  dateRange: string;
}

export function ImportHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    module: '',
    dateRange: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-refresh for active jobs
      const hasActiveJobs = jobs.some(job => 
        ['pending', 'validating', 'importing'].includes(job.status)
      );
      if (hasActiveJobs) {
        fetchJobs();
      }
    }, 10000); // Refresh every 10 seconds for active jobs

    return () => clearInterval(interval);
  }, [jobs]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('import_jobs')
        .select(`
          *,
          template:import_templates(display_name)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('filename', `%${filters.search}%`);
      }

      if (filters.dateRange) {
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            query = query.gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString());
            break;
          case 'week':
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query = query.gte('created_at', weekStart.toISOString());
            break;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            query = query.gte('created_at', monthStart.toISOString());
            break;
          case 'quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            query = query.gte('created_at', quarterStart.toISOString());
            break;
        }
      }

      // Apply sorting
      const ascending = sortConfig.direction === 'asc';
      query = query.order(sortConfig.key, { ascending });

      query = query.limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
      case 'validation_failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success">Completed</Badge>;
      case 'failed':
      case 'validation_failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'importing':
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Importing</Badge>;
      case 'validating':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Validating</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Get unique modules for filter
  const availableModules = useMemo(() => {
    const modules = jobs.map(job => job.template?.display_name).filter(Boolean);
    return [...new Set(modules)];
  }, [jobs]);

  // Filter jobs based on current filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.search && !job.filename.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && job.status !== filters.status) {
        return false;
      }
      if (filters.module && job.template?.display_name !== filters.module) {
        return false;
      }
      if (filters.dateRange) {
        const jobDate = new Date(job.created_at);
        switch (filters.dateRange) {
          case 'today':
            return isToday(jobDate);
          case 'week':
            return isThisWeek(jobDate);
          case 'month':
            return isThisMonth(jobDate);
          case 'quarter':
            return isThisQuarter(jobDate);
          default:
            return true;
        }
      }
      return true;
    });
  }, [jobs, filters]);

  // Apply sorting to filtered jobs
  const { sortedData, sortConfig, requestSort } = useSorting(filteredJobs, { key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleViewDetails = (job: ImportJob) => {
    setSelectedJobId(job.id);
    setIsDetailsModalOpen(true);
  };

  const handleExportErrors = async (job: ImportJob) => {
    if (job.error_rows === 0) return;

    setIsExporting(job.id);
    try {
      // Fetch all errors for this job
      const { data: errors, error } = await supabase
        .from('import_errors')
        .select('*')
        .eq('job_id', job.id)
        .order('row_number');

      if (error) throw error;

      // Create CSV content
      const headers = ['Row Number', 'Field Name', 'Error Type', 'Error Message', 'Raw Value'];
      const csvContent = [
        headers.join(','),
        ...errors.map(err => [
          err.row_number,
          `"${err.field_name || ''}"`,
          `"${err.error_type || ''}"`,
          `"${err.error_message || ''}"`,
          `"${err.raw_value || ''}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-errors-${job.filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${errors.length} import errors to CSV file.`,
      });
    } catch (error) {
      console.error('Error exporting errors:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export error data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ImportHistoryFilters 
        filters={filters}
        onFiltersChange={setFilters}
        modules={availableModules}
      />

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                Track all your data import activities and results
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchJobs}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading import history...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Import History</h3>
              <p className="text-sm">Start by importing your first CSV file</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="filename"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  >
                    File
                  </SortableTableHead>
                  <TableHead>Module</TableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="progress"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  >
                    Progress
                  </SortableTableHead>
                  <TableHead>Results</TableHead>
                  <SortableTableHead
                    sortKey="created_at"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  >
                    Date
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-32 truncate" title={job.filename}>
                        {job.filename}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.template?.display_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={job.progress} className="h-2 w-20" />
                        <span className="text-xs text-muted-foreground">
                          {job.progress.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-success">{job.success_rows}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{job.total_rows}</span>
                        </div>
                        {job.error_rows > 0 && (
                          <div className="text-xs text-destructive">
                            {job.error_rows} errors
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeAgo(job.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(job)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        {job.error_rows > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportErrors(job)}
                            disabled={isExporting === job.id}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            {isExporting === job.id && 'Exporting...'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      <ImportJobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedJobId(null);
        }}
        jobId={selectedJobId}
      />
    </div>
  );
}