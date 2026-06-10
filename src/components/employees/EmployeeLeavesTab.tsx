import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { LeaveRequestForm } from "./LeaveRequestForm";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  status: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  days_requested: number;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
}

interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

interface EmployeeLeavesTabProps {
  employeeId: string;
  leaveBalances?: LeaveBalance[];
  onLeaveUpdate?: () => void;
}

export const EmployeeLeavesTab = ({ employeeId, leaveBalances = [], onLeaveUpdate }: EmployeeLeavesTabProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const { toast } = useToast();
  const { getEmployeePermissions } = usePermissions();
  const permissions = getEmployeePermissions();

  useEffect(() => {
    fetchLeaveRequests();
  }, [employeeId]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'submitted':
        return 'bg-blue-500';
      case 'availed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'availed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getRemainingDays = (leaveType: string) => {
    const balance = leaveBalances.find(b => b.leave_type === leaveType);
    if (!balance) return 0;
    return balance.allocated_days + balance.carried_over_days - balance.used_days;
  };

  const handleFormSuccess = () => {
    fetchLeaveRequests();
    if (onLeaveUpdate) {
      onLeaveUpdate();
    }
    setEditingRequest(null);
  };

  const handleRequestLeave = () => {
    setEditingRequest(null);
    setFormOpen(true);
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setFormOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading leave information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Leave Balances */}
      {leaveBalances.length > 0 && (
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📈 Leave Balances
            </CardTitle>
            {permissions.canUpdate && (
              <Button variant="outline" size="sm">
                🔄 Allocate Leaves
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Current year leave allocation and usage</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveBalances.map((balance) => {
                const remaining = getRemainingDays(balance.leave_type);
                const usagePercentage = (balance.used_days / balance.allocated_days) * 100;
                
                return (
                  <div 
                    key={balance.id} 
                    className="border rounded-lg p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20"
                  >
                    <h4 className="font-semibold capitalize mb-3">
                      {balance.leave_type.replace('_', ' ')}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-3xl font-bold text-primary mb-1">
                          {remaining}
                        </p>
                        <p className="text-sm text-muted-foreground">days remaining</p>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Allocated:</span>
                          <span className="font-semibold">{balance.allocated_days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Used:</span>
                          <span className="font-semibold">{balance.used_days}</span>
                        </div>
                        {balance.carried_over_days > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carried over:</span>
                            <span className="font-semibold">{balance.carried_over_days}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave History */}
      <Card className="bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📅 Leave History
          </CardTitle>
          {permissions.canCreate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestLeave}
              className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Leave
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Employee's leave requests and history</p>
          {leaveRequests.length > 0 ? (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                          {getStatusIcon(request.status)}
                        </div>
                        <h4 className="font-semibold capitalize text-lg">
                          {request.leave_type.replace('_', ' ')}
                        </h4>
                        <Badge className={`${getStatusColor(request.status)} border`}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Start Date:</span>
                          <p>{format(new Date(request.start_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End Date:</span>
                          <p>{format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Requested:</span>
                          <p>{request.days_requested}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>
                          <p>{format(new Date(request.created_at), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      {request.reason && (
                        <div>
                          <span className="text-sm text-muted-foreground">Reason:</span>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      )}
                      {request.approved_at && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            {request.status === 'approved' ? 'Approved' : 'Processed'} on:
                          </span>
                          <p className="text-sm">{format(new Date(request.approved_at), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                      {request.rejection_reason && (
                        <div>
                          <span className="text-sm text-muted-foreground">Rejection Reason:</span>
                          <p className="text-sm text-red-600">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.canUpdate && request.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => handleEditRequest(request)}>
                          ✏️
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          🗑️
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests found</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleRequestLeave}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Request
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <LeaveRequestForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        employeeId={employeeId}
        leaveRequest={editingRequest}
        leaveBalances={leaveBalances}
      />
    </div>
  );
};