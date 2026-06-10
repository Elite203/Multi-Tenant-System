import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from "@/components/layout/Layout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardEmployees } from "@/components/dashboard/DashboardEmployees";
import { DashboardActivity } from "@/components/dashboard/DashboardActivity";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">HR Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back! Here's what's happening with your team today.
            </p>
          </div>
          <Button variant="hero" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Stats Grid */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Employee List */}
          <DashboardEmployees />

          {/* Activity Feed */}
          <DashboardActivity />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Actions</h2>
          <DashboardQuickActions />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
