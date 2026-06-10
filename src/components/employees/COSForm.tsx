import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface COSFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  document?: {
    id: string;
    cos_reference_number: string;
    certificate_number?: string;
    license_number?: string;
    assigned_date?: string;
    certified_date?: string;
    cos_status: string;
    sponsor_note?: string;
    notes?: string;
  };
}

export const COSForm = ({ isOpen, onClose, onSave, employeeId, document }: COSFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cos_reference_number: document?.cos_reference_number || "",
    certificate_number: document?.certificate_number || "",
    license_number: document?.license_number || "",
    assigned_date: document?.assigned_date || "",
    certified_date: document?.certified_date || "",
    cos_status: document?.cos_status || "Active",
    sponsor_note: document?.sponsor_note || "",
    notes: document?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        employee_id: employeeId,
        cos_reference_number: formData.cos_reference_number,
        certificate_number: formData.certificate_number || null,
        license_number: formData.license_number || null,
        assigned_date: formData.assigned_date || null,
        certified_date: formData.certified_date || null,
        cos_status: formData.cos_status as "Active" | "Inactive" | "Expired" | "Archived",
        sponsor_note: formData.sponsor_note || null,
        notes: formData.notes || null,
      };

      if (document) {
        const { error } = await supabase
          .from("employee_cos_documents")
          .update(payload)
          .eq("id", document.id);
        
        if (error) throw error;
        toast({ title: "COS document updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_cos_documents")
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "COS document created successfully" });
      }

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {document ? "Edit COS Document" : "Add COS Document"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cos_reference_number">COS Reference Number *</Label>
            <Input
              id="cos_reference_number"
              value={formData.cos_reference_number}
              onChange={(e) => setFormData({ ...formData, cos_reference_number: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="certificate_number">Certificate Number</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_date">Assigned Date</Label>
              <Input
                id="assigned_date"
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="certified_date">Certified Date</Label>
              <Input
                id="certified_date"
                type="date"
                value={formData.certified_date}
                onChange={(e) => setFormData({ ...formData, certified_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cos_status">COS Status</Label>
            <Select value={formData.cos_status} onValueChange={(value) => setFormData({ ...formData, cos_status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Used">Used</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sponsor_note">Sponsor Note</Label>
            <Textarea
              id="sponsor_note"
              value={formData.sponsor_note}
              onChange={(e) => setFormData({ ...formData, sponsor_note: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};