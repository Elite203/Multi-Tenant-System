import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Archive, Trash2 } from 'lucide-react';

interface EmployeeType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

interface EmployeeTypesManagementProps {
  isUpdating: boolean;
}

export function EmployeeTypesManagement({ isUpdating }: EmployeeTypesManagementProps) {
  const { toast } = useToast();
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmployeeType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_manager: false,
  });

  useEffect(() => {
    fetchEmployeeTypes();
  }, []);

  const fetchEmployeeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployeeTypes(data || []);
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: "Failed to fetch employee types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingType) {
        const { error } = await supabase
          .from('employee_types')
          .update(formData)
          .eq('id', editingType.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Employee type updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('employee_types')
          .insert([{ ...formData, is_active: true }]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Employee type created successfully",
        });
      }

      setDialogOpen(false);
      setEditingType(null);
      resetForm();
      fetchEmployeeTypes();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (employeeType: EmployeeType) => {
    setEditingType(employeeType);
    setFormData({
      name: employeeType.name,
      description: employeeType.description || '',
      is_manager: employeeType.is_manager,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (employeeType: EmployeeType) => {
    try {
      const { error } = await supabase
        .from('employee_types')
        .update({ is_active: !employeeType.is_active })
        .eq('id', employeeType.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Employee type ${!employeeType.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchEmployeeTypes();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete employee type",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (employeeType: EmployeeType) => {
    try {
      // Check if employee type is being used by any employees
      const { data: employees, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_type', employeeType.name.toLowerCase() as any)
        .limit(1);

      if (checkError) throw checkError;

      if (employees && employees.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This employee type is currently assigned to employees and cannot be deleted.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('employee_types')
        .delete()
        .eq('id', employeeType.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee type deleted successfully",
      });
      
      fetchEmployeeTypes();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete employee type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_manager: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Employee Types</CardTitle>
            <CardDescription>
              Manage employee types and their management permissions
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={isUpdating}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Edit Employee Type' : 'Add New Employee Type'}
                </DialogTitle>
                <DialogDescription>
                  {editingType 
                    ? 'Update employee type information' 
                    : 'Create a new employee type'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_manager"
                    checked={formData.is_manager}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_manager: checked }))}
                  />
                  <Label htmlFor="is_manager">Has management permissions</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingType ? 'Update' : 'Create'} Employee Type
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employeeTypes.map((employeeType) => (
            <div
              key={employeeType.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{employeeType.name}</h3>
                    {employeeType.is_manager && (
                      <Badge variant="secondary">Manager</Badge>
                    )}
                    {!employeeType.is_active && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  {employeeType.description && (
                    <p className="text-sm text-muted-foreground">{employeeType.description}</p>
                  )}
                </div>
              </div>
               <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(employeeType)}
                  disabled={isUpdating}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(employeeType)}
                  disabled={isUpdating}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Employee Type</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{employeeType.name}"? This action cannot be undone.
                        If this employee type is currently assigned to any employees, the deletion will be prevented.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(employeeType)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}