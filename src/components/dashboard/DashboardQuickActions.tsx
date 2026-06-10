import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  UserPlus, 
  FileText, 
  Clock,
  BarChart3,
  Settings
} from "lucide-react";

export const DashboardQuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Add Employee",
      description: "Onboard a new team member",
      icon: UserPlus,
      action: () => navigate('/employees'),
      variant: "default" as const,
      bgColor: "bg-card border-primary/20",
    },
    {
      title: "Generate Reports",
      description: "Create detailed analytics reports",
      icon: TrendingUp,
      action: () => navigate('/reports'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
    {
      title: "Document Alerts",
      description: "Review expiring documents",
      icon: AlertTriangle,
      action: () => navigate('/documents'),
      variant: "warning" as const,
      bgColor: "bg-warning/5 border-warning/20 hover:bg-warning/10",
    },
    {
      title: "Leave Requests",
      description: "Review pending leave requests",
      icon: Calendar,
      action: () => navigate('/leave'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
    {
      title: "Timesheets",
      description: "Review pending timesheets",
      icon: Clock,
      action: () => navigate('/timesheets'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
    {
      title: "Analytics",
      description: "View detailed insights",
      icon: BarChart3,
      action: () => navigate('/reports'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
    {
      title: "Manage Documents",
      description: "Upload and organize files",
      icon: FileText,
      action: () => navigate('/documents'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      action: () => navigate('/settings'),
      variant: "outline" as const,
      bgColor: "bg-card hover:bg-accent/50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {quickActions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <Card 
            key={index} 
            className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20 cursor-pointer"
            onClick={action.action}
          >
            <CardContent className="p-6 text-foreground">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <Button variant={action.variant} size="sm" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};