import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentFormData } from "@/types/employeeDocuments";

interface Country {
  id: string;
  name: string;
  code: string;
}

interface VisaType {
  id: string;
  name: string;
  description: string;
}

interface ImmigrationDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  documentType: 'passport' | 'visa' | 'rtw' | 'cos';
  document?: any;
  onSuccess: () => void;
}

export const ImmigrationDocumentForm = ({ isOpen, onClose, employeeId, documentType, document, onSuccess }: ImmigrationDocumentFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; }[]>([]);
  const [employeeCompany, setEmployeeCompany] = useState<{ id: string; name: string; } | null>(null);

  useEffect(() => {
    const defaultData = getDefaultFormData(documentType);
    const dataWithCompany = { ...defaultData, ...(document || {}) };
    
    
    setFormData(dataWithCompany);
  }, [document, documentType, employeeCompany]);

  useEffect(() => {
    const fetchMetadata = async () => {
      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (!countriesError && countriesData) {
        setCountries(countriesData);
      }

      // Fetch visa types
      const { data: visaTypesData, error: visaTypesError } = await supabase
        .from('visa_types')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      
      if (!visaTypesError && visaTypesData) {
        setVisaTypes(visaTypesData);
      }

      // Fetch companies - for COS documents, only show companies with sponsor license
      const companiesQuery = supabase
        .from('companies')
        .select('id, name, has_sponsor_license')
        .eq('is_active', true);
      
      if (documentType === 'cos') {
        companiesQuery.eq('has_sponsor_license', true);
      }
      
      const { data: companiesData, error: companiesError } = await companiesQuery.order('name');
      
      if (!companiesError && companiesData) {
        setCompanies(companiesData);
      }

      // Fetch employee's company
      if (employeeId) {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select(`
            company_id,
            companies!company_id(id, name)
          `)
          .eq('id', employeeId)
          .single();
        
        if (!employeeError && employeeData?.companies) {
          setEmployeeCompany(employeeData.companies);
        }
      }
    };
    
    fetchMetadata();
  }, [employeeId]);

  const getDefaultFormData = (type: string) => {
    switch (type) {
      case 'passport':
        return {
          passport_number: "",
          place_of_birth: "",
          issuing_authority: "",
          issuing_country_id: "",
          issue_date: "",
          expiry_date: "",
          status: "active",
          is_current: true
        };
      case 'visa':
        return {
          visa_type_id: "",
          visa_number: "",
          issuing_country_id: "",
          issue_date: "",
          expiry_date: "",
          conditions: "",
          is_current: true
        };
      case 'rtw':
        return {
          rtw_reference: "",
          rtw_status: "",
          share_code: "",
          checked_date: "",
          expiry_date: "",
          is_current_active: false,
          status: "Active",
          notes: ""
        };
      case 'cos':
        return {
          cos_reference_number: "",
          certificate_number: "",
          license_number: "",
          assigned_date: "",
          certified_date: "",
          cos_status: "Active",
          sponsor_name: "",
          sponsor_note: "",
          notes: ""
        };
      default:
        return {};
    }
  };

  // Remove the helper function as we'll handle each case directly

  const validateForm = () => {
    const errors: string[] = [];

    if (documentType === 'passport') {
      if (!formData.passport_number?.trim()) errors.push("Passport number is required");
      if (!formData.issuing_country_id) errors.push("Issuing country is required");
      if (!formData.expiry_date) errors.push("Expiry date is required");
    } else if (documentType === 'visa') {
      if (!formData.visa_type_id) errors.push("Visa type is required");
      if (!formData.issuing_country_id) errors.push("Issuing country is required");
    } else if (documentType === 'rtw') {
      // RTW documents don't require specific validation
    } else if (documentType === 'cos') {
      if (!formData.cos_reference_number?.trim()) errors.push("COS reference number is required");
    }

    return errors;
  };

  const prepareFormData = (data: DocumentFormData) => {
    // Define allowed fields for each document type based on actual database columns
    const allowedFields = {
      passport: [
        'passport_number', 'place_of_birth', 'issuing_authority', 'issuing_country_id', 
        'nationality_id', 'issue_date', 'expiry_date', 'status', 'is_current'
      ],
      visa: [
        'visa_type_id', 'visa_number', 'issuing_country_id', 'issue_date', 
        'expiry_date', 'conditions', 'is_current', 'valid_for_countries'
      ],
      rtw: [
        'rtw_reference', 'rtw_status', 'share_code', 
        'checked_date', 'expiry_date', 'is_current_active', 
        'status', 'notes'
      ],
      cos: [
        'cos_reference_number', 'certificate_number', 'license_number', 'assigned_date',
        'certified_date', 'cos_status', 'sponsor_name', 'sponsor_note', 'notes'
      ]
    };

    // Get the allowed fields for this document type
    const fields = allowedFields[documentType] || [];
    
    // Filter data to only include allowed fields
    const cleanedData: any = {};
    fields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        // Handle empty strings for UUID fields
        if (['issuing_country_id', 'visa_type_id', 'nationality_id', 'checked_by'].includes(field)) {
          if (data[field] === '') {
            cleanedData[field] = null;
          } else {
            cleanedData[field] = data[field];
          }
        } else {
          // For other fields, convert empty strings to null
          cleanedData[field] = data[field] === '' ? null : data[field];
        }
      }
    });

    // Remove system fields that should not be updated
    if (document?.id) {
      delete cleanedData.id;
      delete cleanedData.employee_id;
      delete cleanedData.created_at;
      delete cleanedData.updated_at;
    }

    return cleanedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const cleanedFormData = prepareFormData(formData);
      let error;
      
      if (document?.id) {
        // Update existing document
        if (documentType === 'passport') {
          const result = await supabase.from('employee_passports').update(cleanedFormData).eq("id", document.id);
          error = result.error;
        } else if (documentType === 'visa') {
          const result = await supabase.from('employee_visas').update(cleanedFormData).eq("id", document.id);
          error = result.error;
        } else if (documentType === 'rtw') {
          const result = await supabase.from('employee_rtw_documents').update(cleanedFormData).eq("id", document.id);
          error = result.error;
        } else if (documentType === 'cos') {
          const result = await supabase.from('employee_cos_documents').update(cleanedFormData).eq("id", document.id);
          error = result.error;
        }
      } else {
        // Create new document
        if (documentType === 'passport') {
          const result = await supabase.from('employee_passports').insert({ ...cleanedFormData, employee_id: employeeId });
          error = result.error;
        } else if (documentType === 'visa') {
          const result = await supabase.from('employee_visas').insert({ ...cleanedFormData, employee_id: employeeId });
          error = result.error;
        } else if (documentType === 'rtw') {
          const result = await supabase.from('employee_rtw_documents').insert({ ...cleanedFormData, employee_id: employeeId });
          error = result.error;
        } else if (documentType === 'cos') {
          const result = await supabase.from('employee_cos_documents').insert({ ...cleanedFormData, employee_id: employeeId });
          error = result.error;
        }
      }

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: `${documentType.toUpperCase()} document ${document?.id ? 'updated' : 'added'} successfully`,
      });
      onSuccess();
      onClose();
    } catch (error: Error | unknown) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (documentType) {
      case 'passport':
        return (
          <>
            <div>
              <Label htmlFor="passport_number">Passport Number *</Label>
              <Input
                id="passport_number"
                required
                value={formData.passport_number || ""}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="place_of_birth">Place of Birth</Label>
              <Input
                id="place_of_birth"
                value={formData.place_of_birth || ""}
                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issuing_authority">Issuing Authority</Label>
              <Input
                id="issuing_authority"
                value={formData.issuing_authority || ""}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issuing_country_id">Issuing Country *</Label>
              <Select value={formData.issuing_country_id || ""} onValueChange={(value) => setFormData({ ...formData, issuing_country_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issuing country" />
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
                  value={formData.issue_date || ""}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  required
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status || "active"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'visa':
        return (
          <>
            <div>
              <Label htmlFor="visa_type_id">Visa Type *</Label>
              <Select value={formData.visa_type_id || ""} onValueChange={(value) => setFormData({ ...formData, visa_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visa type" />
                </SelectTrigger>
                <SelectContent>
                  {visaTypes.map((visaType) => (
                    <SelectItem key={visaType.id} value={visaType.id}>
                      {visaType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visa_number">Visa Number</Label>
              <Input
                id="visa_number"
                value={formData.visa_number || ""}
                onChange={(e) => setFormData({ ...formData, visa_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issuing_country_id">Issuing Country *</Label>
              <Select 
                value={formData.issuing_country_id || ""} 
                onValueChange={(value) => setFormData({ ...formData, issuing_country_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issuing country" />
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
                  value={formData.issue_date || ""}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea
                id="conditions"
                value={formData.conditions || ""}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                rows={3}
              />
            </div>
          </>
        );
      case 'rtw':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rtw_reference">RTW Reference *</Label>
                <Input
                  id="rtw_reference"
                  required
                  value={formData.rtw_reference || ""}
                  onChange={(e) => setFormData({ ...formData, rtw_reference: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rtw_status">RTW Status *</Label>
                <Select value={formData.rtw_status || ""} onValueChange={(value) => setFormData({ ...formData, rtw_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RTW status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="share_code">Share Code</Label>
                <Input
                  id="share_code"
                  value={formData.share_code || ""}
                  onChange={(e) => setFormData({ ...formData, share_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checked_date">Date of Check *</Label>
                <Input
                  id="checked_date"
                  type="date"
                  required
                  value={formData.checked_date || ""}
                  onChange={(e) => setFormData({ ...formData, checked_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || "Active"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_current_active"
                checked={formData.is_current_active || false}
                onChange={(e) => setFormData({ ...formData, is_current_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_current_active">Current Active</Label>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </>
        );
      case 'cos':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cos_reference_number">COS Reference Number *</Label>
                <Input
                  id="cos_reference_number"
                  required
                  value={formData.cos_reference_number || ""}
                  onChange={(e) => setFormData({ ...formData, cos_reference_number: e.target.value })}
                  placeholder="Enter COS reference number"
                />
              </div>
              <div>
                <Label htmlFor="certificate_number">Certificate Number</Label>
                <Input
                  id="certificate_number"
                  value={formData.certificate_number || ""}
                  onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  placeholder="Enter certificate number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number || ""}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <Label htmlFor="sponsor_name">Sponsor Name</Label>
                <Select value={formData.sponsor_name || ''} onValueChange={(value) => setFormData({ ...formData, sponsor_name: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sponsor company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_date">Assigned Date</Label>
                <Input
                  id="assigned_date"
                  type="date"
                  value={formData.assigned_date || ""}
                  onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="certified_date">Certified Date</Label>
                <Input
                  id="certified_date"
                  type="date"
                  value={formData.certified_date || ""}
                  onChange={(e) => setFormData({ ...formData, certified_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cos_status">COS Status</Label>
                <Select value={formData.cos_status || 'Active'} onValueChange={(value) => setFormData({ ...formData, cos_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sponsor_note">Sponsor Note</Label>
                <Input
                  id="sponsor_note"
                  value={formData.sponsor_note || ""}
                  onChange={(e) => setFormData({ ...formData, sponsor_note: e.target.value })}
                  placeholder="Enter sponsor note"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Enter additional notes"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document?.id ? 'Edit' : 'Add'} {documentType.toUpperCase()} Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};