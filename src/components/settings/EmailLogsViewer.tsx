import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export const EmailLogsViewer = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching email logs:', error);
        setLogs([]);
      } else {
        setLogs((data || []).map(log => ({
          ...log,
          status: log.status as 'pending' | 'sent' | 'failed' | 'delivered'
        })));
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-success text-success-foreground';
      case 'delivered': return 'bg-primary text-primary-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/50 rounded animate-pulse" />
        <div className="h-32 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold bg-gradient-hero bg-clip-text text-transparent">
            Email Logs
          </h3>
          <p className="text-sm text-muted-foreground">
            Track email delivery status and history
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background/50 border-border/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="bg-gradient-card shadow-hero border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Logs</h3>
              <p className="text-muted-foreground text-center mb-4">
                Email logs will appear here once emails are sent through the system
              </p>
              <Badge variant="outline" className="text-xs">
                Coming in next release
              </Badge>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="bg-gradient-card shadow-hero border-border/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{log.recipient_email}</h4>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                    {log.sent_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Sent: {format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
                
                {log.error_message && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Error Details</p>
                      <p className="text-xs text-destructive/80">{log.error_message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};