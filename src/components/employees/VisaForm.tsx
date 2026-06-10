import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VisaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  visa?: {
    id: string;
    visa_number: string;
    visa_type: string;
    issuing_country: string;
    issue_date?: string;
    expiry_date?: string;
    is_current: boolean;
    conditions?: string;
  };
}

export const VisaForm = ({ isOpen, onClose, onSave, employeeId, visa }: VisaFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [visaTypes, setVisaTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    visa_number: visa?.visa_number || "",
    visa_type_id: "",
    issuing_country_id: "",
    issue_date: visa?.issue_date || "",
    expiry_date: visa?.expiry_date || "",
    is_current: visa?.is_current || false,
    conditions: visa?.conditions || "",
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from("countries").select("id, name").eq("is_active", true),
        supabase.from("visa_types").select("id, name").eq("is_active", true)
      ]);

      if (countriesRes.data) setCountries(countriesRes.data);
      if (visaTypesRes.data) setVisaTypes(visaTypesRes.data);
    };

    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        employee_id: employeeId,
        ...formData,
        issue_date: formData.issue_date || null,
        expiry_date: formData.expiry_date || null,
        conditions: formData.conditions || null,
        visa_type_id: formData.visa_type_id || null,
      };

      if (visa) {
        const { error } = await supabase
          .from("employee_visas")
          .update(payload)
          .eq("id", visa.id);
        
        if (error) throw error;
        toast({ title: "Visa updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_visas")
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Visa created successfully" });
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
            {visa ? "Edit Visa" : "Add Visa"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visa_number">Visa Number *</Label>
              <Input
                id="visa_number"
                value={formData.visa_number}
                onChange={(e) => setFormData({ ...formData, visa_number: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="visa_type_id">Visa Type</Label>
              <Select value={formData.visa_type_id} onValueChange={(value) => setFormData({ ...formData, visa_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visa type" />
                </SelectTrigger>
                <SelectContent>
                  {visaTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="issuing_country_id">Issuing Country *</Label>
            <Select value={formData.issuing_country_id} onValueChange={(value) => setFormData({ ...formData, issuing_country_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
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
              id="is_current"
              checked={formData.is_current}
              onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked as boolean })}
            />
            <Label htmlFor="is_current">Current Visa</Label>
          </div>

          <div>
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
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