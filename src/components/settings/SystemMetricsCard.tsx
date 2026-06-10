import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, FileText, Clock, Database, TrendingUp, Activity } from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalEmails: number;
  systemUptime: number;
  diskUsage: number;
  responseTime: number;
  errorRate: number;
}

export const SystemMetricsCard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 42,
    activeUsers: 38,
    totalDocuments: 1247,
    totalEmails: 3584,
    systemUptime: 99.8,
    diskUsage: 65,
    responseTime: 245,
    errorRate: 0.2,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (value: number, threshold: number, isInverted = false) => {
    if (isInverted) {
      return value < threshold ? 'text-success' : 'text-destructive';
    }
    return value >= threshold ? 'text-success' : 'text-warning';
  };

  const getProgressColor = (value: number, threshold: number, isInverted = false) => {
    if (isInverted) {
      return value < threshold ? 'bg-success' : 'bg-destructive';
    }
    return value >= threshold ? 'bg-success' : 'bg-warning';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold bg-gradient-hero bg-clip-text text-transparent">
          System Performance Metrics
        </h3>
        <p className="text-sm text-muted-foreground">
          Real-time system performance and usage statistics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                <p className="text-xs text-success">+3 this week</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}% online
                </p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{metrics.totalDocuments.toLocaleString()}</p>
                <p className="text-xs text-success">+12 today</p>
              </div>
              <FileText className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        {/* Total Emails */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold">{metrics.totalEmails.toLocaleString()}</p>
                <p className="text-xs text-success">+47 today</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Uptime</span>
                <span className={getStatusColor(metrics.systemUptime, 99)}>
                  {metrics.systemUptime}%
                </span>
              </div>
              <Progress 
                value={metrics.systemUptime} 
                className="h-2"
                // Add custom color classes based on value
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span className={getStatusColor(metrics.diskUsage, 80, true)}>
                  {metrics.diskUsage}%
                </span>
              </div>
              <Progress 
                value={metrics.diskUsage} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time</span>
                <span className={getStatusColor(metrics.responseTime, 500, true)}>
                  {metrics.responseTime}ms
                </span>
              </div>
              <Progress 
                value={Math.min((metrics.responseTime / 1000) * 100, 100)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Error Rate</span>
                <span className={getStatusColor(metrics.errorRate, 1, true)}>
                  {metrics.errorRate}%
                </span>
              </div>
              <Progress 
                value={metrics.errorRate * 10} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="bg-gradient-card shadow-hero border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Daily Logins</p>
                <p className="text-xl font-bold">156</p>
                <Badge variant="outline" className="text-xs">
                  +12% vs yesterday
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">API Calls</p>
                <p className="text-xl font-bold">2.4k</p>
                <Badge variant="outline" className="text-xs">
                  +5% vs yesterday
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data Transfer</p>
                <p className="text-xl font-bold">124 GB</p>
                <Badge variant="outline" className="text-xs">
                  -2% vs yesterday
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Peak Users</p>
                <p className="text-xl font-bold">42</p>
                <Badge variant="outline" className="text-xs">
                  2:30 PM today
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Real-time Status
          </CardTitle>
          <CardDescription>Current system component status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge className="bg-success text-success-foreground">Online</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">API Server</span>
              </div>
              <Badge className="bg-success text-success-foreground">Online</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="text-sm font-medium">Email Service</span>
              </div>
              <Badge className="bg-warning text-warning-foreground">Degraded</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};