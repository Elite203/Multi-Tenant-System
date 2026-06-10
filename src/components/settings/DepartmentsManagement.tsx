import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  parent_department_id: string | null;
  is_active: boolean;
  parent_department?: { name: string };
}

interface DepartmentsManagementProps {
  isUpdating: boolean;
}

export const DepartmentsManagement = ({ isUpdating }: DepartmentsManagementProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    code: "",
    description: "",
    parent_department_id: "",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select(`
        *,
        parent_department:parent_department_id(name)
      `)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } else {
      setDepartments(data || []);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) return;

    const { error } = await supabase
      .from("departments")
      .insert([{
        name: newDepartment.name,
        code: newDepartment.code || null,
        description: newDepartment.description || null,
        parent_department_id: newDepartment.parent_department_id || null,
        is_active: newDepartment.is_active
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add department",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Department added successfully",
      });
      setNewDepartment({ name: "", code: "", description: "", parent_department_id: "", is_active: true });
      fetchDepartments();
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;

    const { error } = await supabase
      .from("departments")
      .update({
        name: editingDepartment.name,
        code: editingDepartment.code || null,
        description: editingDepartment.description || null,
        parent_department_id: editingDepartment.parent_department_id || null,
        is_active: editingDepartment.is_active
      })
      .eq("id", editingDepartment.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update department",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      setEditingDepartment(null);
      fetchDepartments();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete department. It may be in use.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      fetchDepartments();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("departments")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update department status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Department ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchDepartments();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments Management</CardTitle>
        <CardDescription>
          Manage organizational departments and their hierarchies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Department */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add New Department</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input
                id="dept-name"
                placeholder="e.g., Human Resources"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dept-code">Department Code</Label>
              <Input
                id="dept-code"
                placeholder="e.g., HR"
                value={newDepartment.code}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="parent-dept">Parent Department</Label>
              <Select
                value={newDepartment.parent_department_id || "none"}
                onValueChange={(value) => setNewDepartment(prev => ({ ...prev, parent_department_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="dept-active"
                checked={newDepartment.is_active}
                onCheckedChange={(checked) => setNewDepartment(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="dept-active">Active</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="dept-description">Description</Label>
            <Textarea
              id="dept-description"
              placeholder="Department description..."
              value={newDepartment.description}
              onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button onClick={handleAddDepartment} disabled={isUpdating || !newDepartment.name.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>

        {/* Existing Departments */}
        <div className="space-y-3">
          <h4 className="font-medium">Existing Departments ({departments.length})</h4>
          {departments.map((department) => (
            <div key={department.id} className={`flex items-center justify-between p-3 border rounded-lg transition-opacity ${!department.is_active ? 'opacity-60' : ''}`}>
              {editingDepartment?.id === department.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={editingDepartment.name}
                    onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Department name"
                  />
                  <Input
                    value={editingDepartment.code || ""}
                    onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, code: e.target.value } : null)}
                    placeholder="Code"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateDepartment}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDepartment(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{department.name}</span>
                      {department.code && (
                        <Badge variant="secondary">{department.code}</Badge>
                      )}
                      {!department.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    {department.parent_department && (
                      <p className="text-sm text-muted-foreground">
                        Parent: {department.parent_department.name}
                      </p>
                    )}
                    {department.description && (
                      <p className="text-sm text-muted-foreground">{department.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={department.is_active}
                        onCheckedChange={(checked) => handleToggleActive(department.id, checked)}
                        disabled={isUpdating}
                      />
                      <Label className="text-xs font-medium">
                        {department.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDepartment(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
