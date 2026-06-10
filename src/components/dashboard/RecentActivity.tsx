import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText, Clock, User } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "leave_request",
    user: "Sarah Johnson",
    action: "submitted a leave request",
    time: "2 hours ago",
    icon: Calendar,
    status: "pending"
  },
  {
    id: 2,
    type: "document",
    user: "Mike Chen",
    action: "uploaded passport document",
    time: "4 hours ago",
    icon: FileText,
    status: "completed"
  },
  {
    id: 3,
    type: "timesheet",
    user: "Emma Wilson",
    action: "submitted weekly timesheet",
    time: "6 hours ago",
    icon: Clock,
    status: "approved"
  },
  {
    id: 4,
    type: "profile",
    user: "James Rodriguez",
    action: "updated profile information",
    time: "1 day ago",
    icon: User,
    status: "completed"
  },
  {
    id: 5,
    type: "leave_request",
    user: "Lisa Park",
    action: "leave request approved",
    time: "1 day ago",
    icon: Calendar,
    status: "approved"
  }
];

export function RecentActivity() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning-light text-warning border-warning/20";
      case "approved":
        return "bg-success-light text-success border-success/20";
      case "completed":
        return "bg-primary-light text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <activity.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.user}
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(activity.status)}`}
                >
                  {activity.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {activity.action}
              </p>
              
              <p className="text-xs text-muted-foreground mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <button className="text-sm text-primary hover:text-primary-hover font-medium">
            View all activity →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}