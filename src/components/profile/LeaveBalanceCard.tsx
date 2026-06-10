import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { LeaveBalance } from '@/hooks/useLeaveBalances';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export const LeaveBalanceCard = ({ balance }: LeaveBalanceCardProps) => {
  const remainingDays = balance.allocated_days - balance.used_days + balance.carried_over_days;
  
  const getLeaveTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return <Calendar className="h-4 w-4" />;
      case 'sick': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'bg-primary/10 border-primary/20';
      case 'sick': return 'bg-warning/10 border-warning/20';
      case 'personal': return 'bg-accent/10 border-accent/20';
      default: return 'bg-muted/10 border-muted/20';
    }
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  return (
    <Card className={`${getLeaveTypeColor(balance.leave_type)} border shadow-soft hover:shadow-elegant transition-all duration-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {getLeaveTypeIcon(balance.leave_type)}
            <span>{formatLeaveType(balance.leave_type)} Leave</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {balance.year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Allocated</div>
            <div className="text-lg font-bold text-foreground">{balance.allocated_days}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Used</div>
            <div className="text-lg font-bold text-warning">{balance.used_days}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Remaining</div>
            <div className="text-lg font-bold text-success">{remainingDays}</div>
          </div>
        </div>
        
        {balance.carried_over_days > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Carried over from previous year</span>
              <span className="font-medium">+{balance.carried_over_days}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};