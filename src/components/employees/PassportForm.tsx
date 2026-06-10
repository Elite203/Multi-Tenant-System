import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PassportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  passport?: {
    id: string;
    passport_number: string;
    issuing_country: string;
    issue_date?: string;
    expiry_date?: string;
    status: string;
    is_current: boolean;
  };
}

export const PassportForm = ({ isOpen, onClose, onSave, employeeId, passport }: PassportFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    passport_number: passport?.passport_number || "",
    issuing_country_id: "",
    nationality_id: "",
    issue_date: passport?.issue_date || "",
    expiry_date: passport?.expiry_date || "",
    status: passport?.status || "active",
    is_current: passport?.is_current || false,
    place_of_birth: "",
    issuing_authority: "",
  });

  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from("countries")
        .select("id, name")
        .eq("is_active", true);

      if (data) setCountries(data);
    };

    if (isOpen) {
      fetchCountries();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        employee_id: employeeId,
        passport_number: formData.passport_number,
        issuing_country_id: formData.issuing_country_id,
        nationality_id: formData.nationality_id || null,
        issue_date: formData.issue_date || null,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        is_current: formData.is_current,
        place_of_birth: formData.place_of_birth || null,
        issuing_authority: formData.issuing_authority || null,
      };

      if (passport) {
        const { error } = await supabase
          .from("employee_passports")
          .update(payload)
          .eq("id", passport.id);
        
        if (error) throw error;
        toast({ title: "Passport updated successfully" });
      } else {
        const { error } = await supabase
          .from("employee_passports")
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Passport created successfully" });
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
            {passport ? "Edit Passport" : "Add Passport"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passport_number">Passport Number *</Label>
              <Input
                id="passport_number"
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            
            <div>
              <Label htmlFor="nationality_id">Nationality</Label>
              <Select value={formData.nationality_id} onValueChange={(value) => setFormData({ ...formData, nationality_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="place_of_birth">Place of Birth</Label>
              <Input
                id="place_of_birth"
                value={formData.place_of_birth}
                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="issuing_authority">Issuing Authority</Label>
              <Input
                id="issuing_authority"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_current"
              checked={formData.is_current}
              onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked as boolean })}
            />
            <Label htmlFor="is_current">Current Passport</Label>
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