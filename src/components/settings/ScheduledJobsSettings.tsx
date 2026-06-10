import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Play, Pause, TestTube, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  cron_expression: string;
  function_name: string;
  is_active: boolean;
  last_run?: Date | null;
  next_run?: Date | null;
  success_count: number;
  error_count: number;
  created_at: Date;
  updated_at: Date;
}

export const ScheduledJobsSettings = () => {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  const fetchScheduledJobs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match component interface
      const transformedJobs: ScheduledJob[] = (data || []).map(job => ({
        id: job.id,
        name: job.name,
        description: job.description || '',
        cron_expression: job.cron_expression,
        function_name: job.function_name,
        is_active: job.is_active,
        last_run: job.last_run_at ? new Date(job.last_run_at) : null,
        next_run: job.next_run_at ? new Date(job.next_run_at) : null,
        success_count: job.success_count,
        error_count: job.error_count,
        created_at: new Date(job.created_at),
        updated_at: new Date(job.updated_at)
      }));
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleJob = async (jobId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_jobs')
        .update({ is_active: newStatus })
        .eq('id', jobId);

      if (error) throw error;
      
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, is_active: newStatus }
          : job
      ));
      
      toast({ 
        title: "Success", 
        description: `Job ${newStatus ? 'enabled' : 'disabled'} successfully` 
      });
    } catch (error) {
      console.error('Error toggling job:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update job status" 
      });
    }
  };

  const handleRunNow = async (jobId: string, functionName: string) => {
    try {
      const { error } = await supabase.functions.invoke(functionName, {
        body: { manual_trigger: true, job_id: jobId }
      });

      if (error) {
        console.error('Error running job:', error);
        toast({ 
          title: "Error", 
          description: "Failed to trigger job execution" 
        });
      } else {
        toast({ 
          title: "Job Triggered", 
          description: "Manual execution started successfully" 
        });
        // Refresh the jobs list to update last_run time
        fetchScheduledJobs();
      }
    } catch (error) {
      console.error('Error running job:', error);
      toast({ 
        title: "Error", 
        description: "Failed to trigger job execution" 
      });
    }
  };

  const getStatusColor = (isActive: boolean, successCount: number, errorCount: number) => {
    if (!isActive) return 'bg-muted text-muted-foreground';
    if (errorCount > successCount / 10) return 'bg-destructive text-destructive-foreground';
    return 'bg-success text-success-foreground';
  };

  const getStatusIcon = (isActive: boolean, successCount: number, errorCount: number) => {
    if (!isActive) return <Pause className="h-3 w-3" />;
    if (errorCount > successCount / 10) return <AlertCircle className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card shadow-hero">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Scheduled Jobs</span>
          </CardTitle>
          <CardDescription>
            Monitor and manage automated system tasks and background processes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Jobs List */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="bg-gradient-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{job.name}</h3>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={`${getStatusColor(job.is_active, job.success_count, job.error_count)} border-none`}
                  >
                    {getStatusIcon(job.is_active, job.success_count, job.error_count)}
                    <span className="ml-1">
                      {job.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Schedule Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">Schedule</label>
                  <p className="font-mono bg-muted px-2 py-1 rounded text-xs">
                    {job.cron_expression}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">Function</label>
                  <p className="font-mono bg-muted px-2 py-1 rounded text-xs">
                    {job.function_name}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">Success Rate</label>
                  <p className="text-xs">
                    {job.success_count + job.error_count > 0 
                      ? `${Math.round((job.success_count / (job.success_count + job.error_count)) * 100)}%`
                      : 'No runs yet'
                    }
                  </p>
                </div>
              </div>

              <Separator />

              {/* Execution Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">Last Run</label>
                  <p className="text-xs">
                    {job.last_run 
                      ? format(job.last_run, 'MMM dd, yyyy HH:mm:ss')
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">Next Run</label>
                  <p className="text-xs">
                    {job.next_run 
                      ? format(job.next_run, 'MMM dd, yyyy HH:mm:ss')
                      : 'Not scheduled'
                    }
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-success/10 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Success</span>
                  </div>
                  <p className="text-lg font-bold text-success">{job.success_count}</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Errors</span>
                  </div>
                  <p className="text-lg font-bold text-destructive">{job.error_count}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleJob(job.id, !job.is_active)}
                  >
                    {job.is_active ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {job.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRunNow(job.id, job.function_name)}
                    disabled={!job.is_active}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {format(job.updated_at, 'MMM dd, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="bg-gradient-card shadow-sm">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Jobs</h3>
            <p className="text-muted-foreground">
              No automated tasks are currently configured.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};