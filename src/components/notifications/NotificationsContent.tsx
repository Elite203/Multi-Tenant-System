import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

export const NotificationsContent: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !notification.read_at) ||
      (filterStatus === 'read' && notification.read_at);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      await clearAllNotifications();
    }
  };

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Bell className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'You\'re all caught up!'
              }
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllRead} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {notifications.length} Total
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="default">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-gradient-to-br from-background via-background/95 to-primary/5 border-border/50 shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="leave_request">Leave Requests</SelectItem>
                <SelectItem value="leave_approved">Leave Approved</SelectItem>
                <SelectItem value="leave_rejected">Leave Rejected</SelectItem>
                <SelectItem value="document_expiry">Document Expiry</SelectItem>
                <SelectItem value="timesheet_reminder">Timesheet Reminder</SelectItem>
                <SelectItem value="payslip_available">Payslip Available</SelectItem>
                <SelectItem value="employee_update">Employee Updates</SelectItem>
                <SelectItem value="system_alert">System Alerts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-gradient-to-br from-background via-background/95 to-primary/5 border-border/50 shadow-soft">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                  {i < 4 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'No matching notifications' 
                  : 'No notifications yet'
                }
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                  : 'When you receive notifications, they\'ll appear here. Stay tuned for updates!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem notification={notification} />
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="opacity-50" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};