import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Clock, User, AlertCircle, CheckCircle, Download, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

interface ImportJob {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  progress: number;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  warning_rows: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_summary: any;
  template: {
    display_name: string;
    description: string;
  };
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ImportError {
  id: string;
  row_number: number;
  field_name: string;
  error_message: string;
  error_type: string;
  raw_value: string;
}

interface ImportJobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export function ImportJobDetailsModal({ isOpen, onClose, jobId }: ImportJobDetailsModalProps) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
    }
  }, [isOpen, jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .select(`
          *,
          template:import_templates(display_name, description)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch user details separately if user_id exists
      let userData = null;
      if (jobData?.user_id) {
        const { data: user } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', jobData.user_id)
          .single();
        userData = user;
      }

      // Fetch error details if there are errors
      let errorData = [];
      if (jobData.error_rows > 0) {
        const { data: errors, error: errorError } = await supabase
          .from('import_errors')
          .select('*')
          .eq('job_id', jobId)
          .order('row_number')
          .limit(100);

        if (errorError) throw errorError;
        errorData = errors || [];
      }

      setJob({ ...jobData, user: userData });
      setErrors(errorData);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Error",
        description: "Failed to load job details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportErrors = async () => {
    if (!job || job.error_rows === 0) return;

    setIsExporting(true);
    try {
      // Fetch all errors for this job
      const { data: allErrors, error } = await supabase
        .from('import_errors')
        .select('*')
        .eq('job_id', job.id)
        .order('row_number');

      if (error) throw error;

      // Create CSV content
      const headers = ['Row Number', 'Field Name', 'Error Type', 'Error Message', 'Raw Value'];
      const csvContent = [
        headers.join(','),
        ...allErrors.map(err => [
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
      a.download = `import-errors-${job.filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${allErrors.length} import errors to CSV file.`,
      });
    } catch (error) {
      console.error('Error exporting errors:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export error data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Job Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about the import process and results
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : job ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">File Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Filename:</span>
                        <span className="font-medium">{job.filename}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{formatFileSize(job.file_size)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Module:</span>
                        <span>{job.template?.display_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {getStatusBadge(job.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Import Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Rows:</span>
                        <span className="font-medium">{job.total_rows}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processed:</span>
                        <span>{job.processed_rows}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Successful:</span>
                        <span className="text-success">{job.success_rows}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Errors:</span>
                        <span className="text-destructive">{job.error_rows}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Warnings:</span>
                        <span className="text-warning">{job.warning_rows}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {job.user && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Initiated By
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <span className="font-medium">
                          {job.user.first_name} {job.user.last_name}
                        </span>
                        <span className="text-muted-foreground ml-2">({job.user.email})</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Import Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{job.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-success">{job.success_rows}</div>
                        <div className="text-xs text-muted-foreground">Successful</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-destructive">{job.error_rows}</div>
                        <div className="text-xs text-muted-foreground">Errors</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-warning">{job.warning_rows}</div>
                        <div className="text-xs text-muted-foreground">Warnings</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {job.error_rows > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Import Errors</h3>
                        <p className="text-sm text-muted-foreground">
                          Showing first 100 errors. Export for complete list.
                        </p>
                      </div>
                      <Button 
                        onClick={exportErrors} 
                        disabled={isExporting}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export All Errors'}
                      </Button>
                    </div>

                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Field</TableHead>
                              <TableHead>Error Type</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {errors.map((error) => (
                              <TableRow key={error.id}>
                                <TableCell className="font-mono text-xs">
                                  {error.row_number}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {error.field_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {error.error_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-48 truncate">
                                  {error.error_message}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-32 truncate">
                                  {error.raw_value}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="h-12 w-12 text-success mb-4" />
                      <h3 className="font-medium mb-2">No Errors Found</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        This import completed successfully without any errors.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Processing Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="h-2 w-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Job Created</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(job.created_at), 'PPpp')}
                          </div>
                        </div>
                      </div>

                      {job.started_at && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="h-2 w-2 bg-warning rounded-full" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Processing Started</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(job.started_at), 'PPpp')}
                            </div>
                          </div>
                        </div>
                      )}

                      {job.completed_at && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`h-2 w-2 rounded-full ${
                            job.status === 'completed' ? 'bg-success' : 'bg-destructive'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {job.status === 'completed' ? 'Completed Successfully' : 'Failed'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(job.completed_at), 'PPpp')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {job.started_at && job.completed_at && (
                      <div className="pt-4 border-t">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total processing time: </span>
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(job.started_at), { 
                              addSuffix: false 
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}