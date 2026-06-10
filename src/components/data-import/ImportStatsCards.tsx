import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImportStats {
  availableModules: number;
  templatesReady: number;
  importStatus: string;
  dataQuality: number;
}

export function ImportStatsCards() {
  const [stats, setStats] = useState<ImportStats>({
    availableModules: 0,
    templatesReady: 0,
    importStatus: 'Ready',
    dataQuality: 95
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get template count
      const { data: templates, error: templatesError } = await supabase
        .from('import_templates')
        .select('id')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // Get recent job status
      const { data: recentJob } = await supabase
        .from('import_jobs')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate data quality based on recent successful imports
      const { data: completedJobs } = await supabase
        .from('import_jobs')
        .select('success_rows, total_rows')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      let avgQuality = 95; // Default
      if (completedJobs && completedJobs.length > 0) {
        const totalRows = completedJobs.reduce((sum, job) => sum + job.total_rows, 0);
        const successRows = completedJobs.reduce((sum, job) => sum + job.success_rows, 0);
        avgQuality = totalRows > 0 ? Math.round((successRows / totalRows) * 100) : 95;
      }

      setStats({
        availableModules: templates?.length || 0,
        templatesReady: templates?.length || 0,
        importStatus: recentJob?.status === 'importing' ? 'In Progress' : 'Ready',
        dataQuality: avgQuality
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle,
    color = "text-primary"
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle: string;
    color?: string;
  }) => (
    <Card className="shadow-soft border-0">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-muted/50`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {title}
              </h3>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded w-8 h-6" />
                ) : (
                  value
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FileText}
        title="Available Modules"
        value={stats.availableModules}
        subtitle="Data types"
        color="text-primary"
      />
      
      <StatCard
        icon={CheckCircle}
        title="Templates Ready"
        value={stats.templatesReady}
        subtitle="To download"
        color="text-success"
      />
      
      <StatCard
        icon={Clock}
        title="Import Status"
        value={stats.importStatus}
        subtitle="Current state"
        color="text-warning"
      />
      
      <StatCard
        icon={BarChart3}
        title="Data Quality"
        value={`${stats.dataQuality}%`}
        subtitle="Valid score"
        color="text-primary"
      />
    </div>
  );
}