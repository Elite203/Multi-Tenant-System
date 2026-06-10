import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RTWDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  document?: {
    id: string;
    rtw_reference: string;
    rtw_status: string;
    share_code?: string;
    checked_date?: string;
    expiry_date?: string;
    is_current_active: boolean;
    status: string;
    notes?: string;
  };
}

export const RTWDocumentForm = ({ isOpen, onClose, onSave, employeeId, document }: RTWDocumentFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rtw_reference: document?.rtw_reference || "",
    rtw_status: document?.rtw_status || "",
    share_code: document?.share_code || "",
    checked_date: document?.checked_date || "",
    expiry_date: document?.expiry_date || "",
    is_current_active: document?.is_current_active || false,
    status: document?.status || "Active",
    notes: document?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        employee_id: employeeId,
        ...formData,
        checked_date: formData.checked_date || null,
        expiry_date: formData.expiry_date || null,
        share_code: formData.share_code || null,
        notes: formData.notes || null,
      };

      if (document) {
        const { error } = await supabase
          .from("employee_rtw_documents")
          .update(payload)
          .eq("id", document.id);
        
        if (error) throw error;
        toast({ title: "RTW document updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_rtw_documents")
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "RTW document created successfully" });
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
            {document ? "Edit RTW Document" : "Add RTW Document"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rtw_reference">RTW Reference *</Label>
              <Input
                id="rtw_reference"
                value={formData.rtw_reference}
                onChange={(e) => setFormData({ ...formData, rtw_reference: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="rtw_status">RTW Status</Label>
              <Input
                id="rtw_status"
                value={formData.rtw_status}
                onChange={(e) => setFormData({ ...formData, rtw_status: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="share_code">Share Code</Label>
              <Input
                id="share_code"
                value={formData.share_code}
                onChange={(e) => setFormData({ ...formData, share_code: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checked_date">Checked Date</Label>
              <Input
                id="checked_date"
                type="date"
                value={formData.checked_date}
                onChange={(e) => setFormData({ ...formData, checked_date: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_current_active"
              checked={formData.is_current_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_current_active: checked as boolean })}
            />
            <Label htmlFor="is_current_active">Current Active Document</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
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