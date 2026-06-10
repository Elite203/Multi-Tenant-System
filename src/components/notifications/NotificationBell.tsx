import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPanel } from './NotificationPanel';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative transition-all duration-300",
            hasUnread
              ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
              : "hover:bg-mustard/10"
          )}
        >
          <Bell className={cn(
            "h-5 w-5 transition-colors duration-300",
            hasUnread ? "text-orange-500" : "text-muted-foreground"
          )} />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 shadow-lg animate-pulse"
            >
              {displayCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-gradient-to-br from-background via-background/95 to-primary/5 border-gradient shadow-hero" 
        align="end"
        sideOffset={8}
      >
        <NotificationPanel onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};