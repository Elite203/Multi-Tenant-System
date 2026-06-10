import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, RefreshCw, Settings, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

interface LeaveAllocation {
  id: string;
  leave_type: string;
  default_allocation: number;
  max_carry_forward: number;
  fiscal_year_start: string;
  is_active: boolean;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export const LeaveSettings = () => {
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<LeaveAllocation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const { getLeavePermissions } = usePermissions();
  const permissions = getLeavePermissions();

  const [formData, setFormData] = useState({
    leave_type: '' as 'annual' | 'sick' | 'maternity' | 'paternity' | 'bereavement' | 'personal' | '',
    default_allocation: 0,
    max_carry_forward: 0,
    fiscal_year_start: '',
    is_active: true,
    requires_approval: true,
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'bereavement', label: 'Bereavement Leave' },
    { value: 'personal', label: 'Personal Leave' },
  ];

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_allocations')
        .select('*')
        .order('leave_type');

      if (error) throw error;
      setAllocations(data || []);
    } catch (error) {
      console.error('Error fetching leave allocations:', error);
      toast({
        title: "Error",
        description: "Failed to load leave allocations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (allocation: LeaveAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      leave_type: allocation.leave_type as any,
      default_allocation: allocation.default_allocation,
      max_carry_forward: allocation.max_carry_forward,
      fiscal_year_start: allocation.fiscal_year_start,
      is_active: allocation.is_active,
      requires_approval: allocation.requires_approval,
    });
    setModalOpen(true);
  };

  const handleNewAllocation = () => {
    setEditingAllocation(null);
    setFormData({
      leave_type: '',
      default_allocation: 0,
      max_carry_forward: 0,
      fiscal_year_start: '2024-04-01',
      is_active: true,
      requires_approval: true,
    });
    setModalOpen(true);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leave_type || formData.default_allocation < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    try {
      let error;
      if (editingAllocation) {
        const { error: updateError } = await supabase
          .from('leave_allocations')
          .update(formData as any)
          .eq('id', editingAllocation.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('leave_allocations')
          .insert([formData as any]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Leave allocation ${editingAllocation ? 'updated' : 'created'} successfully`,
      });

      fetchAllocations();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving leave allocation:', error);
      toast({
        title: "Error",
        description: "Failed to save leave allocation",
        variant: "destructive",
      });
    }
  };

  const handleSyncBalances = async () => {
    if (!permissions.canUpdate) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to sync leave balances",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('sync_employee_leave_balances');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Synced leave balances for all employees. Total balances processed: ${data}`,
      });
    } catch (error) {
      console.error('Error syncing leave balances:', error);
      toast({
        title: "Error",
        description: "Failed to sync employee leave balances",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const leaveType = leaveTypes.find(lt => lt.value === type);
    return leaveType ? leaveType.label : type;
  };

  if (loading) {
    return <div className="p-6">Loading leave settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Leave Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure annual leave allocations and system settings
          </p>
        </div>
        {permissions.canUpdate && (
          <Button 
            onClick={handleNewAllocation}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Leave Type
          </Button>
        )}
      </div>

      {/* Leave Allocations */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Allocations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.length > 0 ? (
              <>
                <div className="hidden md:grid grid-cols-6 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                  <div>Leave Type</div>
                  <div>Annual Allocation</div>
                  <div>Carry Forward</div>
                  <div>Fiscal Year Start</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {allocations.map((allocation) => (
                  <div 
                    key={allocation.id} 
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20"
                  >
                    <div>
                      <span className="md:hidden font-medium text-muted-foreground">Leave Type: </span>
                      <span className="font-semibold capitalize">
                        {getLeaveTypeLabel(allocation.leave_type)}
                      </span>
                    </div>
                    <div>
                      <span className="md:hidden font-medium text-muted-foreground">Annual Allocation: </span>
                      <span className="font-semibold">{allocation.default_allocation} days</span>
                    </div>
                    <div>
                      <span className="md:hidden font-medium text-muted-foreground">Carry Forward: </span>
                      <span className="font-semibold">{allocation.max_carry_forward} days</span>
                    </div>
                    <div>
                      <span className="md:hidden font-medium text-muted-foreground">Fiscal Year: </span>
                      <span className="font-semibold">
                        {format(new Date(allocation.fiscal_year_start), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="md:hidden font-medium text-muted-foreground">Status: </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        allocation.is_active 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {allocation.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      {permissions.canUpdate && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(allocation)}
                          className="hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Settings className="h-8 w-8 text-primary opacity-50" />
                </div>
                <p className="text-muted-foreground mb-4">No leave allocations configured</p>
                {permissions.canUpdate && (
                  <Button 
                    variant="outline" 
                    onClick={handleNewAllocation}
                    className="hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Allocation
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Employee Balances */}
      {permissions.canUpdate && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sync Employee Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recalculate All Employee Leave Balances</p>
                <p className="text-sm text-muted-foreground">
                  This will update all employee leave balances based on the current allocations
                </p>
              </div>
              <Button 
                onClick={handleSyncBalances}
                disabled={syncing}
                className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-glow"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Calendar className="h-5 w-5" />
              {editingAllocation ? 'Edit Leave Allocation' : 'Add Leave Allocation'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAllocation} className="space-y-4">
            <div>
              <Label htmlFor="leave_type">Leave Type *</Label>
              <select
                id="leave_type"
                value={formData.leave_type}
                onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                disabled={!!editingAllocation}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_allocation">Annual Allocation (days) *</Label>
                <Input
                  id="default_allocation"
                  type="number"
                  min="0"
                  value={formData.default_allocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_allocation: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="max_carry_forward">Max Carry Forward (days)</Label>
                <Input
                  id="max_carry_forward"
                  type="number"
                  min="0"
                  value={formData.max_carry_forward}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_carry_forward: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
              <Input
                id="fiscal_year_start"
                type="date"
                value={formData.fiscal_year_start}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscal_year_start: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
                />
                <Label htmlFor="requires_approval">Requires Approval</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAllocation ? 'Update' : 'Create'} Allocation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};