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
}

interface JobTitle {
  id: string;
  title: string;
  department_id: string | null;
  level: string | null;
  description: string | null;
  is_active: boolean;
  department?: { name: string };
}

interface JobTitlesManagementProps {
  isUpdating: boolean;
}

export const JobTitlesManagement = ({ isUpdating }: JobTitlesManagementProps) => {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
  const [newJobTitle, setNewJobTitle] = useState({
    title: "",
    department_id: "",
    level: "",
    description: "",
    is_active: true
  });
  const { toast } = useToast();

  const levels = ["Entry", "Mid", "Senior", "Lead", "Manager", "Director", "VP", "C-Level"];

  useEffect(() => {
    fetchJobTitles();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setDepartments(data);
    }
  };

  const fetchJobTitles = async () => {
    const { data, error } = await supabase
      .from("job_titles")
      .select(`
        *,
        department:department_id(name)
      `)
      .order("title");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch job titles",
        variant: "destructive",
      });
    } else {
      setJobTitles(data || []);
    }
  };

  const handleAddJobTitle = async () => {
    if (!newJobTitle.title.trim()) return;

    const { error } = await supabase
      .from("job_titles")
      .insert([{
        title: newJobTitle.title,
        department_id: newJobTitle.department_id || null,
        level: newJobTitle.level || null,
        description: newJobTitle.description || null,
        is_active: newJobTitle.is_active
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add job title",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job title added successfully",
      });
      setNewJobTitle({ title: "", department_id: "", level: "", description: "", is_active: true });
      fetchJobTitles();
    }
  };

  const handleUpdateJobTitle = async () => {
    if (!editingJobTitle) return;

    const { error } = await supabase
      .from("job_titles")
      .update({
        title: editingJobTitle.title,
        department_id: editingJobTitle.department_id || null,
        level: editingJobTitle.level || null,
        description: editingJobTitle.description || null,
        is_active: editingJobTitle.is_active
      })
      .eq("id", editingJobTitle.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job title",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job title updated successfully",
      });
      setEditingJobTitle(null);
      fetchJobTitles();
    }
  };

  const handleDeleteJobTitle = async (id: string) => {
    const { error } = await supabase
      .from("job_titles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete job title. It may be in use.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job title deleted successfully",
      });
      fetchJobTitles();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("job_titles")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job title status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Job title ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchJobTitles();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Titles Management</CardTitle>
        <CardDescription>
          Manage job titles and their department assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Job Title */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add New Job Title</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-title">Job Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g., Software Engineer"
                value={newJobTitle.title}
                onChange={(e) => setNewJobTitle(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="job-department">Department</Label>
              <Select
                value={newJobTitle.department_id || "none"}
                onValueChange={(value) => setNewJobTitle(prev => ({ ...prev, department_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="job-level">Level</Label>
              <Select
                value={newJobTitle.level || "none"}
                onValueChange={(value) => setNewJobTitle(prev => ({ ...prev, level: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No level</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="job-active"
                checked={newJobTitle.is_active}
                onCheckedChange={(checked) => setNewJobTitle(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="job-active">Active</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="job-description">Description</Label>
            <Textarea
              id="job-description"
              placeholder="Job title description..."
              value={newJobTitle.description}
              onChange={(e) => setNewJobTitle(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button onClick={handleAddJobTitle} disabled={isUpdating || !newJobTitle.title.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job Title
          </Button>
        </div>

        {/* Existing Job Titles */}
        <div className="space-y-3">
          <h4 className="font-medium">Existing Job Titles ({jobTitles.length})</h4>
          {jobTitles.map((jobTitle) => (
            <div key={jobTitle.id} className={`flex items-center justify-between p-3 border rounded-lg transition-opacity ${!jobTitle.is_active ? 'opacity-60' : ''}`}>
              {editingJobTitle?.id === jobTitle.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={editingJobTitle.title}
                    onChange={(e) => setEditingJobTitle(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Job title"
                  />
                  <Select
                    value={editingJobTitle.department_id || "none"}
                    onValueChange={(value) => setEditingJobTitle(prev => prev ? { ...prev, department_id: value === "none" ? "" : value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={editingJobTitle.level || "none"}
                    onValueChange={(value) => setEditingJobTitle(prev => prev ? { ...prev, level: value === "none" ? "" : value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No level</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateJobTitle}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingJobTitle(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{jobTitle.title}</span>
                      {jobTitle.level && (
                        <Badge variant="secondary">{jobTitle.level}</Badge>
                      )}
                      {!jobTitle.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    {jobTitle.department && (
                      <p className="text-sm text-muted-foreground">
                        Department: {jobTitle.department.name}
                      </p>
                    )}
                    {jobTitle.description && (
                      <p className="text-sm text-muted-foreground">{jobTitle.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={jobTitle.is_active}
                        onCheckedChange={(checked) => handleToggleActive(jobTitle.id, checked)}
                        disabled={isUpdating}
                      />
                      <Label className="text-xs font-medium">
                        {jobTitle.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingJobTitle(jobTitle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteJobTitle(jobTitle.id)}
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
