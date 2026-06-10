import { StatsCard } from "./StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Calendar, FileText, Clock, Building, TrendingUp, Shield, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardStats = () => {
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      change: `${stats.employeeGrowth}% growth this month`,
      trend: stats.employeeGrowth > 0 ? "up" as const : "neutral" as const,
      icon: Users,
    },
    {
      title: "Active Employees",
      value: stats.activeEmployees,
      change: `${Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}% of total`,
      trend: "up" as const,
      icon: UserPlus,
    },
    {
      title: "Pending Leave Requests",
      value: stats.pendingLeaveRequests,
      change: "Require attention",
      trend: stats.pendingLeaveRequests > 5 ? "down" as const : "neutral" as const,
      icon: Calendar,
    },
    {
      title: "Documents Expiring",
      value: stats.documentsExpiring,
      change: "Next 30 days",
      trend: stats.documentsExpiring > 10 ? "down" as const : "neutral" as const,
      icon: FileText,
    },
    {
      title: "Timesheets Pending",
      value: stats.timesheetsPending,
      change: "Need approval",
      trend: stats.timesheetsPending > 15 ? "down" as const : "neutral" as const,
      icon: Clock,
    },
    {
      title: "Total Departments",
      value: stats.totalDepartments,
      change: "Active departments",
      trend: "neutral" as const,
      icon: Building,
    },
    {
      title: "Compliance Score",
      value: `${stats.complianceScore}%`,
      change: stats.complianceScore >= 80 ? "Excellent" : stats.complianceScore >= 60 ? "Good" : "Needs attention",
      trend: stats.complianceScore >= 80 ? "up" as const : stats.complianceScore >= 60 ? "neutral" as const : "down" as const,
      icon: Shield,
    },
    {
      title: "Employee Growth",
      value: `${stats.employeeGrowth}%`,
      change: "Last 30 days",
      trend: stats.employeeGrowth > 0 ? "up" as const : "neutral" as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          trend={stat.trend}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};