import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkProfile {
  id?: string;
  employee_id: string;
  soc_number?: string;
  work_email?: string;
  work_phone?: string;
  work_location?: string;
  weekly_working_hours?: number;
  sponsored_by_company_id?: string;
  start_date?: string;
  end_date?: string;
}

interface Company {
  id: string;
  name: string;
}

interface WorkProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  workProfile?: WorkProfile | null;
}

export const WorkProfileForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  employeeId, 
  workProfile 
}: WorkProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState<WorkProfile>({
    employee_id: employeeId,
    soc_number: '',
    work_email: '',
    work_phone: '',
    work_location: '',
    weekly_working_hours: undefined,
    sponsored_by_company_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      if (workProfile) {
        setFormData({
          ...workProfile,
          start_date: workProfile.start_date || '',
          end_date: workProfile.end_date || '',
          soc_number: workProfile.soc_number || '',
          work_email: workProfile.work_email || '',
          work_phone: workProfile.work_phone || '',
          work_location: workProfile.work_location || '',
          weekly_working_hours: workProfile.weekly_working_hours,
          sponsored_by_company_id: workProfile.sponsored_by_company_id || 'none',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, workProfile]);

  const resetForm = () => {
    setFormData({
      employee_id: employeeId,
      soc_number: '',
      work_email: '',
      work_phone: '',
      work_location: '',
      weekly_working_hours: undefined,
      sponsored_by_company_id: 'none',
      start_date: '',
      end_date: '',
    });
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        employee_id: formData.employee_id,
        soc_number: formData.soc_number || null,
        work_email: formData.work_email || null,
        work_phone: formData.work_phone || null,
        work_location: formData.work_location || null,
        weekly_working_hours: formData.weekly_working_hours || null,
        sponsored_by_company_id: formData.sponsored_by_company_id === 'none' ? null : formData.sponsored_by_company_id,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };


      let result;
      if (workProfile?.id) {
        result = await supabase
          .from('employee_work_profiles')
          .update(dataToSave)
          .eq('id', workProfile.id)
          .select();

        
        if (result.error) throw result.error;
      } else {
        result = await supabase
          .from('employee_work_profiles')
          .insert([dataToSave])
          .select();

        
        if (result.error) throw result.error;
      }

      toast({
        title: "Success",
        description: `Work profile ${workProfile ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving work profile:', error);
      toast({
        title: "Error",
        description: "Failed to save work profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workProfile ? 'Edit Work Profile' : 'Add Work Profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="soc_number">SOC Number</Label>
                <Input
                  id="soc_number"
                  value={formData.soc_number || ''}
                  onChange={(e) => setFormData({ ...formData, soc_number: e.target.value })}
                  placeholder="Enter SOC number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_email">Work Email</Label>
                  <Input
                    id="work_email"
                    type="email"
                    value={formData.work_email || ''}
                    onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                    placeholder="Enter work email"
                  />
                </div>
                <div>
                  <Label htmlFor="work_phone">Work Phone</Label>
                  <Input
                    id="work_phone"
                    value={formData.work_phone || ''}
                    onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                    placeholder="Enter work phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_location">Work Location</Label>
                  <Input
                    id="work_location"
                    value={formData.work_location || ''}
                    onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                    placeholder="Enter work location"
                  />
                </div>
                <div>
                  <Label htmlFor="weekly_working_hours">Weekly Working Hours</Label>
                  <Input
                    id="weekly_working_hours"
                    type="number"
                    min="1"
                    max="168"
                    value={formData.weekly_working_hours || ''}
                    onChange={(e) => setFormData({ ...formData, weekly_working_hours: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 40"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sponsored_by">Sponsored by</Label>
                <Select
                  value={formData.sponsored_by_company_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, sponsored_by_company_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sponsoring company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (workProfile ? 'Update' : 'Create')} Work Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};