import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface Payslip {
  id?: string;
  employee_id: string;
  month: number;
  year: number;
  status: string;
  notes?: string;
  attachment_path?: string;
}

interface PayslipFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  payslip?: Payslip | null;
}

export const PayslipForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  employeeId, 
  payslip 
}: PayslipFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    month: '',
    year: '',
    status: 'draft',
    notes: '',
    attachment_path: '',
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    if (isOpen) {
      if (payslip) {
        setFormData({
          month: payslip.month.toString(),
          year: payslip.year.toString(),
          status: payslip.status,
          notes: payslip.notes || '',
          attachment_path: payslip.attachment_path || '',
        });
      } else {
        setFormData({
          month: '',
          year: currentYear.toString(),
          status: 'draft',
          notes: '',
          attachment_path: '',
        });
      }
    }
  }, [isOpen, payslip, currentYear]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/payslips/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setFormData(prev => ({ ...prev, attachment_path: fileName }));
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month || !formData.year) {
      toast({
        title: "Missing information",
        description: "Please select both month and year",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const payslipData = {
        employee_id: employeeId,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        status: formData.status,
        notes: formData.notes || null,
        attachment_path: formData.attachment_path || null,
      };

      let error;
      if (payslip?.id) {
        const { error: updateError } = await supabase
          .from('payslips')
          .update(payslipData)
          .eq('id', payslip.id);
        error = updateError;
      } else {
        // Check if payslip already exists for this month/year
        const { data: existing } = await supabase
          .from('payslips')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('month', parseInt(formData.month))
          .eq('year', parseInt(formData.year))
          .maybeSingle();

        if (existing) {
          toast({
            title: "Payslip exists",
            description: "A payslip for this month/year already exists",
            variant: "destructive",
          });
          return;
        }

        const { error: insertError } = await supabase
          .from('payslips')
          .insert([payslipData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payslip ${payslip?.id ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving payslip:', error);
      toast({
        title: "Error",
        description: "Failed to save payslip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payslip?.id ? 'Edit Payslip' : 'Add Payslip'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={formData.month} onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={formData.year} onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this payslip"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="attachment">Attachment</Label>
            <div className="mt-1">
              <Input
                id="attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Upload className="h-4 w-4 inline mr-1 animate-spin" />
                  Uploading...
                </p>
              )}
              {formData.attachment_path && (
                <p className="text-sm text-green-600 mt-1">
                  File uploaded successfully
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Saving...' : (payslip?.id ? 'Update' : 'Create')} Payslip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};