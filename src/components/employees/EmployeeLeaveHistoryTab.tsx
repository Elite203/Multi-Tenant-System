import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  reason?: string;
  approved_by?: string;
  approved_at?: string;
}

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

interface EmployeeLeaveHistoryTabProps {
  employeeId: string;
  leaveBalances: LeaveBalance[];
}

export const EmployeeLeaveHistoryTab = ({ employeeId, leaveBalances }: EmployeeLeaveHistoryTabProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [employeeId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'default';
      case 'pending': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRemainingDays = (leaveType: string) => {
    const balance = leaveBalances.find(lb => lb.leave_type === leaveType);
    if (!balance) return 0;
    return balance.allocated_days + balance.carried_over_days - balance.used_days;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Leave Balances */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveBalances.map((balance) => (
              <div
                key={balance.id}
                className="p-4 bg-background/50 rounded-lg border border-border/50"
              >
                <h3 className="font-semibold text-sm mb-2">{balance.leave_type}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated:</span>
                    <span>{balance.allocated_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span>{balance.used_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carried Over:</span>
                    <span>{balance.carried_over_days} days</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Remaining:</span>
                    <span className="text-green-600">{getRemainingDays(balance.leave_type)} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Leave Requests History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{request.leave_type}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Days:</span>
                      <span className="ml-2 font-medium">{request.days_requested}</span>
                    </div>
                    
                    {request.reason && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Reason:</span>
                        <span className="ml-2">{request.reason}</span>
                      </div>
                    )}
                    
                    {request.approved_by && (
                      <div>
                        <span className="text-muted-foreground">Approved by:</span>
                        <span className="ml-2">{request.approved_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};