import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  company_code?: string;
  parent_company_id?: string;
  holding_company_id?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  registration_number?: string;
  has_sponsor_license: boolean;
  status?: string;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  country_id?: string;
  director?: string;
  owner?: string;
  logo?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  street_address?: string;
  parent_company?: any;
  child_companies?: Company[];
}

interface EditCompanyDialogProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allCompanies: Company[];
}

export function EditCompanyDialog({ company, isOpen, onClose, onSuccess, allCompanies }: EditCompanyDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    company_code: '',
    parent_company_id: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country_id: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    tax_number: '',
    registration_number: '',
    has_sponsor_license: false,
  });
  const [countries, setCountries] = useState<Array<{id: string, name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safely filter parent companies
  const availableParentCompanies = useMemo(() => {
    if (!allCompanies || !company) return [];
    return allCompanies.filter(c => 
      c && c.id !== company.id && 
      c.parent_company_id !== company.id &&
      !c.parent_company_id
    );
  }, [allCompanies, company]);

  useEffect(() => {
    if (isOpen && company) {
      setFormData({
        name: company.name || '',
        company_code: company.company_code || '',
        parent_company_id: company.parent_company_id || 'none',
        street_address: company.street_address || '',
        city: company.city || '',
        state_province: company.state_province || '',
        postal_code: company.postal_code || '',
        country_id: company.country_id || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        description: company.description || '',
        tax_number: company.tax_number || '',
        registration_number: company.registration_number || '',
        has_sponsor_license: company.has_sponsor_license || false,
      });
    }
    if (isOpen) {
      fetchCountries();
    }
  }, [isOpen, company]);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        name: formData.name.trim(),
        company_code: formData.company_code?.trim() || null,
        street_address: formData.street_address?.trim() || null,
        city: formData.city?.trim() || null,
        state_province: formData.state_province?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        country_id: formData.country_id || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        description: formData.description?.trim() || null,
        tax_number: formData.tax_number?.trim() || null,
        registration_number: formData.registration_number?.trim() || null,
        has_sponsor_license: formData.has_sponsor_license,
        parent_company_id: formData.parent_company_id === 'none' ? null : formData.parent_company_id || null,
      };

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while updating the company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {company ? (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update {company.name} information
            </DialogDescription>
          </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-code">Company Code</Label>
              <Input
                id="edit-company-code"
                value={formData.company_code}
                onChange={(e) => setFormData(prev => ({ ...prev, company_code: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-parent-company">Parent Company</Label>
            <Select
              value={formData.parent_company_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, parent_company_id: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent company (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent company</SelectItem>
                {availableParentCompanies.map((parentCompany) => (
                  <SelectItem key={parentCompany.id} value={parentCompany.id}>
                    {parentCompany.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-street-address">Street Address</Label>
            <Input
              id="edit-street-address"
              value={formData.street_address}
              onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state-province">State/Province</Label>
              <Input
                id="edit-state-province"
                value={formData.state_province}
                onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-postal-code">Postal Code</Label>
              <Input
                id="edit-postal-code"
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Select
                value={formData.country_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country_id: value }))}
                disabled={isSubmitting}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tax-number">Tax Number</Label>
              <Input
                id="edit-tax-number"
                value={formData.tax_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-registration-number">Registration Number</Label>
              <Input
                id="edit-registration-number"
                value={formData.registration_number}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-has-sponsor-license"
              checked={formData.has_sponsor_license}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_sponsor_license: checked }))}
              disabled={isSubmitting}
            />
            <Label htmlFor="edit-has-sponsor-license">Has Sponsor License</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Company'}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}