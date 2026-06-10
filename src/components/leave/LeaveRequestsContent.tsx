import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CheckCircle, XCircle, Clock, Filter, User, Calendar, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { LeaveModal } from "./LeaveModal";
import { LeaveStatsCards } from "./LeaveStatsCards";

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
  employees: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

export const LeaveRequestsContent = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const { toast } = useToast();
  const { getLeavePermissions } = usePermissions();
  const permissions = getLeavePermissions();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, statusFilter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees!leave_requests_employee_id_fkey (
            first_name,
            last_name,
            employee_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests((data as unknown as LeaveRequest[]) || []);
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

  const filterRequests = () => {
    let filtered = leaveRequests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        `${request.employees.first_name} ${request.employees.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.employees.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setModalOpen(true);
  };

  const handleNewRequest = () => {
    setEditingRequest(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchLeaveRequests();
    setEditingRequest(null);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });

      fetchLeaveRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request rejected",
      });

      fetchLeaveRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    }
  };

  const statusFilterOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return <div className="p-6">Loading leave requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Leave Requests
          </h1>
          <p className="text-muted-foreground text-lg">
            Review and manage team leave requests
          </p>
        </div>
        {permissions.canCreate && (
          <Button 
            onClick={handleNewRequest}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Leave Request
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <LeaveStatsCards />

      {/* Filter Controls */}
      <Card className="bg-gradient-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by employee name, number, or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {statusFilterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                  className={statusFilter === option.value ? 
                    "bg-gradient-to-r from-primary to-primary/80 shadow-glow" : 
                    "hover:bg-muted"
                  }
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="border rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-lg">
                          {request.employees.first_name} {request.employees.last_name}
                        </h4>
                        <Badge className={`${getStatusColor(request.status)} border`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground font-medium">Employee ID:</span>
                          <p className="font-semibold">{request.employees.employee_number}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Leave Type:</span>
                          <p className="font-semibold capitalize">{request.leave_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Duration:</span>
                          <p className="font-semibold">
                            {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Days:</span>
                          <p className="font-semibold">{request.days_requested} days</p>
                        </div>
                      </div>

                      {request.reason && (
                        <div>
                          <span className="text-muted-foreground font-medium">Reason:</span>
                          <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{request.reason}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        {request.approved_at && (
                          <span> • Processed on {format(new Date(request.approved_at), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {permissions.canUpdate && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditRequest(request)}
                          className="hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {permissions.canUpdate && request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-muted-foreground mb-4">No leave requests found</p>
              {permissions.canCreate && (
                <Button 
                  variant="outline" 
                  onClick={handleNewRequest}
                  className="hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <LeaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        leaveRequest={editingRequest}
      />
    </div>
  );
};