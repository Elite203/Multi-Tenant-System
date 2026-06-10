import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaveStats {
  pending_requests: number;
  approved_requests: number;
  total_requests: number;
  total_days_requested: number;
}

export const LeaveStatsCards = () => {
  const [stats, setStats] = useState<LeaveStats>({
    pending_requests: 0,
    approved_requests: 0,
    total_requests: 0,
    total_days_requested: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leave_statistics');
      if (error) throw error;
      setStats(data as unknown as LeaveStats);
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Pending Requests",
      value: stats.pending_requests,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    },
    {
      title: "Approved Requests",
      value: stats.approved_requests,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    },
    {
      title: "Total Requests",
      value: stats.total_requests,
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    },
    {
      title: "Days Requested",
      value: stats.total_days_requested,
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card 
            key={index} 
            className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant ${card.bgGradient}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${card.gradient} shadow-glow`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};