import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Home,
  Building,
  Bell,
  Timer,
  Upload
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Companies", url: "/companies", icon: Building },
  { title: "Leave Management", url: "/leave", icon: Calendar },
  { title: "ROTA Scheduling", url: "/rota", icon: Clock },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Payroll", url: "/payroll", icon: DollarSign },
  { title: "Timesheets", url: "/timesheets", icon: Timer },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Organization", url: "/organization", icon: Building2 },
  { title: "My Profile", url: "/profile", icon: User },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const adminItems = profile?.role === 'admin' ? [
    { title: "Data Import", url: "/data-import", icon: Upload },
    { title: "Settings", url: "/settings", icon: Settings },
  ] : [];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return cn(
      "w-full justify-start gap-3 transition-all duration-200",
      isActive(path)
        ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-56",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded bg-gradient-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">HR Manager</h2>
              <p className="text-xs text-muted-foreground">Enterprise</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main Menu
            </p>
          )}
          {navigationItems.map((item) => (
            <NavLink key={item.url} to={item.url} className="block">
              <Button
                variant="ghost"
                size="sm"
                className={getNavClassName(item.url)}
              >
                <item.icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "")} />
                {!collapsed && <span>{item.title}</span>}
              </Button>
            </NavLink>
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="space-y-1 pt-4">
            {!collapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            )}
            {adminItems.map((item) => (
              <NavLink key={item.url} to={item.url} className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getNavClassName(item.url)}
                >
                  <item.icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "")} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{profile?.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}