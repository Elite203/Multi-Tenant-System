import { format, eachDayOfInterval, isSameDay, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Building2 } from "lucide-react";

interface Shift {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_avatar?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  shift_type_name: string;
  shift_type_color: string;
  location_name: string;
  department_name: string;
}

interface RotaCalendarViewProps {
  shifts: Shift[];
  weekStart: Date;
  onShiftClick: (shift: Shift) => void;
  isLoading: boolean;
}

export function RotaCalendarView({ shifts = [], weekStart, onShiftClick, isLoading }: RotaCalendarViewProps) {
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'no_show': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default: return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => (
          <Card key={index} className="min-h-[300px]">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {weekDays.map((day) => {
        const dayShifts = getShiftsForDay(day);
        const isToday = isSameDay(day, new Date());
        
        return (
          <Card key={day.toISOString()} className={`min-h-[300px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                {format(day, "EEE")}
              </CardTitle>
              <p className={`text-sm ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {format(day, "MMM d")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No shifts scheduled
                </p>
              ) : (
                dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => onShiftClick(shift)}
                    className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
                    style={{ 
                      borderLeftColor: shift.shift_type_color,
                      borderLeftWidth: '4px'
                    }}
                  >
                    {/* Employee Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={shift.employee_avatar} />
                        <AvatarFallback className="text-xs">
                          {shift.employee_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {shift.employee_name}
                      </span>
                    </div>

                    {/* Time & Type */}
                    <div className="flex items-center gap-1 mb-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(`2000-01-01T${shift.start_time}`), 'HH:mm')} - 
                        {format(new Date(`2000-01-01T${shift.end_time}`), 'HH:mm')}
                      </span>
                    </div>

                    {/* Shift Type */}
                    <Badge 
                      variant="secondary" 
                      className="text-xs mb-2"
                      style={{ backgroundColor: `${shift.shift_type_color}20`, color: shift.shift_type_color }}
                    >
                      {shift.shift_type_name}
                    </Badge>

                    {/* Location & Department */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {shift.location_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {shift.department_name}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-2 ${getStatusColor(shift.status)}`}
                    >
                      {shift.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}