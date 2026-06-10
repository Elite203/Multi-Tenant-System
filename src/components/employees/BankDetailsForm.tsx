import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankDetails {
  id?: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  is_primary: boolean;
  is_active: boolean;
}

interface BankDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  bankDetails?: BankDetails;
  onSuccess: () => void;
}

export const BankDetailsForm = ({ isOpen, onClose, employeeId, bankDetails, onSuccess }: BankDetailsFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BankDetails>({
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    sort_code: "",
    iban: "",
    swift_code: "",
    is_primary: true,
    is_active: true
  });

  useEffect(() => {
    if (bankDetails) {
      setFormData(bankDetails);
    } else {
      setFormData({
        bank_name: "",
        account_holder_name: "",
        account_number: "",
        sort_code: "",
        iban: "",
        swift_code: "",
        is_primary: true,
        is_active: true
      });
    }
  }, [bankDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (bankDetails?.id) {
        // Update existing bank details
        const { error } = await supabase
          .from("employee_bank_details")
          .update(formData)
          .eq("id", bankDetails.id);

        if (error) throw error;
      } else {
        // Create new bank details
        const { error } = await supabase
          .from("employee_bank_details")
          .insert({ ...formData, employee_id: employeeId });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Bank details ${bankDetails?.id ? 'updated' : 'added'} successfully`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast({
        title: "Error",
        description: "Failed to save bank details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl">{bankDetails?.id ? 'Edit' : 'Add'} Bank Details</DialogTitle>
              <p className="text-sm text-muted-foreground">Manage employee banking information</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account_holder_name">Account Holder Name *</Label>
              <Input
                id="account_holder_name"
                required
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                required
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sort_code">Sort Code</Label>
              <Input
                id="sort_code"
                placeholder="XX-XX-XX"
                value={formData.sort_code}
                onChange={(e) => setFormData({ ...formData, sort_code: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="swift_code">SWIFT Code</Label>
            <Input
              id="swift_code"
              value={formData.swift_code}
              onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              />
              <Label htmlFor="is_primary">Primary Account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border/20">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-hero hover:shadow-glow transition-all duration-300 text-white font-semibold rounded-xl px-6">
              {isLoading ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};