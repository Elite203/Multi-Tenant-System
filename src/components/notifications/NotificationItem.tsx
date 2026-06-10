import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  Users, 
  Clock, 
  CreditCard, 
  FileText, 
  Settings, 
  Eye, 
  Check, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'leave_request':
    case 'leave_approved':
    case 'leave_rejected':
      return Calendar;
    case 'employee_update':
      return Users;
    case 'timesheet_reminder':
      return Clock;
    case 'payslip_available':
      return CreditCard;
    case 'document_expiry':
      return FileText;
    case 'system_alert':
    default:
      return Settings;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'leave_request':
    case 'leave_approved':
    case 'leave_rejected':
      return 'text-blue-500 bg-blue-500/10';
    case 'employee_update':
      return 'text-green-500 bg-green-500/10';
    case 'timesheet_reminder':
      return 'text-orange-500 bg-orange-500/10';
    case 'payslip_available':
      return 'text-purple-500 bg-purple-500/10';
    case 'document_expiry':
      return 'text-amber-500 bg-amber-500/10';
    case 'system_alert':
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, removeNotification } = useNotifications();
  const { toast } = useToast();
  
  const Icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColor(notification.type);
  const isUnread = !notification.read_at;
  
  const handleMarkAsRead = async () => {
    if (isUnread) {
      await markAsRead([notification.id]);
    }
  };

  const handleRemove = async () => {
    await removeNotification(notification.id);
  };

  const handleView = () => {
    // Navigate to related content based on type and metadata
    if (notification.related_entity_type && notification.related_entity_id) {
      // TODO: Implement navigation logic
      toast({
        title: "Navigation",
        description: `Would navigate to ${notification.related_entity_type}`,
      });
    }
    if (isUnread) {
      handleMarkAsRead();
    }
  };

  return (
    <div className={cn(
      "group relative p-3 rounded-lg transition-all duration-200 hover:bg-muted/30",
      isUnread 
        ? "bg-primary/5 border-l-4 border-primary shadow-sm" 
        : "opacity-75 hover:opacity-100"
    )}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
          colorClasses
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-medium text-sm leading-5 break-words",
              isUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            
            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>

            {/* Action buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {notification.related_entity_type && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleView}
                  className="h-6 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
              
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-6 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
};