import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Globe, CreditCard, FileText, Calendar, CheckCircle, AlertCircle, XCircle, Plus, Edit, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { ImmigrationDocumentForm } from "./ImmigrationDocumentForm";
import { ImmigrationStatusBadge } from "./ImmigrationStatusBadge";
import { PassportDocument, VisaDocument, RTWDocument, COSDocument } from "@/types/employeeDocuments";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useSorting } from "@/hooks/useSorting";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  immigration_status?: 'pending_review' | 'approved' | 'rejected' | 'expired' | 'requires_renewal';
}

interface EmployeePassport {
  id: string;
  passport_number: string;
  place_of_birth?: string;
  issuing_authority?: string;
  issuing_country?: string;
  issuing_country_id?: string;
  issue_date?: string;
  expiry_date: string;
  status?: string;
  is_current: boolean;
  document_path?: string;
  countries?: { name: string };
  created_at: string;
}

interface EmployeeVisa {
  id: string;
  visa_type_id?: string;
  visa_types?: { name: string };
  visa_number?: string;
  issuing_country_id: string;
  countries?: { name: string };
  issue_date?: string;
  expiry_date?: string;
  entry_date?: string;
  conditions?: string;
  is_current: boolean;
  document_path?: string;
  created_at: string;
}

interface EmployeeRTWDocument {
  id: string;
  rtw_reference?: string;
  rtw_status?: string;
  share_code?: string;
  checked_date?: string;
  expiry_date?: string;
  is_current_active: boolean;
  status: string;
  document_path?: string;
  notes?: string;
  created_at: string;
}

interface EmployeeCOSDocument {
  id: string;
  cos_reference_number: string;
  certificate_number?: string;
  license_number?: string;
  assigned_date?: string;
  certified_date?: string;
  cos_status?: string;
  sponsor_name?: string;
  sponsor_note?: string;
  document_path?: string;
  notes?: string;
  created_at: string;
  sponsor_company?: {
    id: string;
    name: string;
  };
}

interface EnhancedImmigrationTabProps {
  employee: Employee;
  passports: EmployeePassport[];
  visas: EmployeeVisa[];
  rtwDocuments: EmployeeRTWDocument[];
  cosDocuments: EmployeeCOSDocument[];
  onDocumentUpdate?: () => void;
}

export const EnhancedImmigrationTab = ({ employee, passports, visas, rtwDocuments, cosDocuments, onDocumentUpdate }: EnhancedImmigrationTabProps) => {
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentType, setDocumentType] = useState<'passport' | 'visa' | 'rtw' | 'cos'>('passport');
  const [editingDocument, setEditingDocument] = useState<any>(undefined);
  const { getImmigrationPermissions } = usePermissions();
  const { toast } = useToast();

  const permissions = getImmigrationPermissions();

  // Sorting hooks for each table
  const { sortedData: sortedPassports, sortConfig: passportSort, requestSort: requestPassportSort } = useSorting(passports, { key: 'expiry_date', direction: 'asc' });
  const { sortedData: sortedVisas, sortConfig: visaSort, requestSort: requestVisaSort } = useSorting(visas, { key: 'expiry_date', direction: 'asc' });
  const { sortedData: sortedRTWDocuments, sortConfig: rtwSort, requestSort: requestRTWSort } = useSorting(rtwDocuments, { key: 'checked_date', direction: 'desc' });
  const { sortedData: sortedCOSDocuments, sortConfig: cosSort, requestSort: requestCOSSort } = useSorting(cosDocuments, { key: 'expiry_date', direction: 'asc' });
  
  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: 'no-expiry', color: 'bg-secondary', text: 'No Expiry' };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', color: 'bg-destructive', text: 'Expired' };
    } else if (diffDays <= 30) {
      return { status: 'expiring-soon', color: 'bg-orange-500', text: 'Expiring Soon' };
    } else {
      return { status: 'valid', color: 'bg-green-500', text: 'Valid' };
    }
  };

  const handleAddDocument = (type: 'passport' | 'visa' | 'rtw' | 'cos') => {
    setDocumentType(type);
    setEditingDocument(undefined);
    setShowDocumentForm(true);
  };

  const handleEditDocument = (type: 'passport' | 'visa' | 'rtw' | 'cos', document: EmployeePassport | EmployeeVisa | EmployeeRTWDocument | EmployeeCOSDocument) => {
    setDocumentType(type);
    setEditingDocument(document);
    setShowDocumentForm(true);
  };

  const handleDeleteDocument = async (type: 'passport' | 'visa' | 'rtw' | 'cos', documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      let error;
      
      if (type === 'passport') {
        const result = await supabase.from('employee_passports').delete().eq("id", documentId);
        error = result.error;
      } else if (type === 'visa') {
        const result = await supabase.from('employee_visas').delete().eq("id", documentId);
        error = result.error;
      } else if (type === 'rtw') {
        const result = await supabase.from('employee_rtw_documents').delete().eq("id", documentId);
        error = result.error;
      } else if (type === 'cos') {
        const result = await supabase.from('employee_cos_documents').delete().eq("id", documentId);
        error = result.error;
      }

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      if (onDocumentUpdate) onDocumentUpdate();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (type: 'passport' | 'visa', documentId: string) => {
    try {
      let error;
      
      if (type === 'passport') {
        // First, set all passports to not current
        await supabase.from('employee_passports')
          .update({ is_current: false })
          .eq('employee_id', employee.id);
        
        // Then set the selected one as current
        const result = await supabase.from('employee_passports')
          .update({ is_current: true })
          .eq('id', documentId);
        error = result.error;
      } else if (type === 'visa') {
        // First, set all visas to not current
        await supabase.from('employee_visas')
          .update({ is_current: false })
          .eq('employee_id', employee.id);
        
        // Then set the selected one as current
        const result = await supabase.from('employee_visas')
          .update({ is_current: true })
          .eq('id', documentId);
        error = result.error;
      }

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Primary document updated successfully",
      });
      if (onDocumentUpdate) onDocumentUpdate();
    } catch (error) {
      console.error("Error updating primary document:", error);
      toast({
        title: "Error",
        description: "Failed to update primary document",
        variant: "destructive",
      });
    }
  };

  // Calculate overview stats
  const currentPassport = passports.find(p => p.is_current);
  const currentVisa = visas.find(v => v.is_current);
  const activeRTW = rtwDocuments.find(d => d.is_current_active);
  const activeCOS = cosDocuments.find(c => c.cos_status === 'Active');

  return (
    <div className="space-y-6">
      {/* Immigration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Immigration Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              {currentPassport ? <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /> : <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />}
              <p className="text-sm font-medium">Passports</p>
              <p className="text-xs text-muted-foreground">{passports.length} total</p>
            </div>
            <div className="text-center">
              {currentVisa ? <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /> : <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />}
              <p className="text-sm font-medium">Visas</p>
              <p className="text-xs text-muted-foreground">{visas.length} total</p>
            </div>
            <div className="text-center">
              {activeRTW ? <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /> : <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />}
              <p className="text-sm font-medium">Right to Work</p>
              <p className="text-xs text-muted-foreground">{rtwDocuments.length} documents</p>
            </div>
            <div className="text-center">
              {activeCOS ? <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /> : <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />}
              <p className="text-sm font-medium">COS</p>
              <p className="text-xs text-muted-foreground">{cosDocuments.length} documents</p>
            </div>
          </div>
          <div className="text-center">
            <ImmigrationStatusBadge status={employee.immigration_status} />
          </div>
        </CardContent>
      </Card>

      {/* Passports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Passports ({passports.length})
            </div>
            {permissions.canCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddDocument('passport')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Passport
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="passport_number" currentSort={passportSort} onSort={requestPassportSort}>Number</SortableTableHead>
                  <SortableTableHead sortKey="countries.name" currentSort={passportSort} onSort={requestPassportSort}>Country</SortableTableHead>
                  <SortableTableHead sortKey="issue_date" currentSort={passportSort} onSort={requestPassportSort}>Issue Date</SortableTableHead>
                  <SortableTableHead sortKey="expiry_date" currentSort={passportSort} onSort={requestPassportSort}>Expiry Date</SortableTableHead>
                  <SortableTableHead sortKey="is_current" currentSort={passportSort} onSort={requestPassportSort}>Status</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPassports.map((passport) => {
                  const expiryStatus = getExpiryStatus(passport.expiry_date);
                  return (
                    <TableRow key={passport.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {passport.is_current && <Star className="h-4 w-4 text-amber-500" />}
                          {passport.passport_number}
                        </div>
                      </TableCell>
                      <TableCell>{passport.countries?.name || 'N/A'}</TableCell>
                      <TableCell>{passport.issue_date ? format(new Date(passport.issue_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell>{format(new Date(passport.expiry_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={`${expiryStatus.color} text-white`}>
                          {expiryStatus.text}
                        </Badge>
                        {passport.is_current && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!passport.is_current && permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimary('passport', passport.id)}
                              title="Set as primary passport"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument('passport', passport)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument('passport', passport.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No passport information available</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleAddDocument('passport')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Passport
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Visas ({visas.length})
            </div>
            {permissions.canCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddDocument('visa')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Visa
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="visa_types.name" currentSort={visaSort} onSort={requestVisaSort}>Type</SortableTableHead>
                  <SortableTableHead sortKey="visa_number" currentSort={visaSort} onSort={requestVisaSort}>Number</SortableTableHead>
                  <SortableTableHead sortKey="countries.name" currentSort={visaSort} onSort={requestVisaSort}>Country</SortableTableHead>
                  <SortableTableHead sortKey="expiry_date" currentSort={visaSort} onSort={requestVisaSort}>Expiry Date</SortableTableHead>
                  <SortableTableHead sortKey="is_current" currentSort={visaSort} onSort={requestVisaSort}>Status</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVisas.map((visa) => {
                  const expiryStatus = visa.expiry_date ? getExpiryStatus(visa.expiry_date) : { status: 'no-expiry', color: 'bg-secondary', text: 'No Expiry' };
                  return (
                    <TableRow key={visa.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {visa.is_current && <Star className="h-4 w-4 text-amber-500" />}
                          {visa.visa_types?.name || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>{visa.visa_number || 'N/A'}</TableCell>
                      <TableCell>{visa.countries?.name || 'N/A'}</TableCell>
                      <TableCell>{visa.expiry_date ? format(new Date(visa.expiry_date), 'MMM dd, yyyy') : 'No expiry'}</TableCell>
                      <TableCell>
                        <Badge className={`${expiryStatus.color} text-white`}>
                          {expiryStatus.text}
                        </Badge>
                        {visa.is_current && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!visa.is_current && permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimary('visa', visa.id)}
                              title="Set as primary visa"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument('visa', visa)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument('visa', visa.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No visa information available</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleAddDocument('visa')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Visa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right to Work Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Right to Work Documents ({rtwDocuments.length})
            </div>
            {permissions.canCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddDocument('rtw')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rtwDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                   <SortableTableHead sortKey="rtw_reference" currentSort={rtwSort} onSort={requestRTWSort}>RTW Reference</SortableTableHead>
                   <SortableTableHead sortKey="rtw_status" currentSort={rtwSort} onSort={requestRTWSort}>RTW Status</SortableTableHead>
                   <SortableTableHead sortKey="share_code" currentSort={rtwSort} onSort={requestRTWSort}>Share Code</SortableTableHead>
                   <SortableTableHead sortKey="checked_date" currentSort={rtwSort} onSort={requestRTWSort}>Date of Check</SortableTableHead>
                   <SortableTableHead sortKey="expiry_date" currentSort={rtwSort} onSort={requestRTWSort}>Expiry Date</SortableTableHead>
                   <SortableTableHead sortKey="is_current_active" currentSort={rtwSort} onSort={requestRTWSort}>Current Active</SortableTableHead>
                   <SortableTableHead sortKey="status" currentSort={rtwSort} onSort={requestRTWSort}>Status</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRTWDocuments.map((doc) => {
                  const expiryStatus = doc.expiry_date ? getExpiryStatus(doc.expiry_date) : { status: 'no-expiry', color: 'bg-secondary', text: 'No Expiry' };
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.rtw_reference || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={doc.rtw_status === 'valid' ? 'default' : 'destructive'}>
                          {doc.rtw_status || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.share_code || '-'}</TableCell>
                      <TableCell>
                        {doc.checked_date ? format(new Date(doc.checked_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <div className="flex items-center gap-2">
                            {format(new Date(doc.expiry_date), 'dd/MM/yyyy')}
                            <Badge className={`${expiryStatus.color} text-white text-xs`}>
                              {expiryStatus.text}
                            </Badge>
                          </div>
                        ) : '-'}
                      </TableCell>
                       <TableCell>
                         <Badge variant={doc.is_current_active ? 'default' : 'secondary'}>
                           {doc.is_current_active ? 'Yes' : 'No'}
                         </Badge>
                       </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            doc.status === 'Active' ? 'default' : 
                            doc.status === 'Expired' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument('rtw', doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument('rtw', doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No right to work documents available</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleAddDocument('rtw')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate of Sponsorship */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Certificate of Sponsorship ({cosDocuments.length})
            </div>
            {permissions.canCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddDocument('cos')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add COS
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cosDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                   <SortableTableHead sortKey="cos_reference_number" currentSort={cosSort} onSort={requestCOSSort}>COS Reference</SortableTableHead>
                   <SortableTableHead sortKey="certificate_number" currentSort={cosSort} onSort={requestCOSSort}>Certificate Number</SortableTableHead>
                   <SortableTableHead sortKey="license_number" currentSort={cosSort} onSort={requestCOSSort}>License Number</SortableTableHead>
                   <SortableTableHead sortKey="sponsor_name" currentSort={cosSort} onSort={requestCOSSort}>Sponsor Company</SortableTableHead>
                   <SortableTableHead sortKey="assigned_date" currentSort={cosSort} onSort={requestCOSSort}>Assigned Date</SortableTableHead>
                   <SortableTableHead sortKey="certified_date" currentSort={cosSort} onSort={requestCOSSort}>Certified Date</SortableTableHead>
                   <SortableTableHead sortKey="cos_status" currentSort={cosSort} onSort={requestCOSSort}>Status</SortableTableHead>
                   <SortableTableHead sortKey="sponsor_note" currentSort={cosSort} onSort={requestCOSSort}>Sponsor Note</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCOSDocuments.map((cos) => {
                   return (
                     <TableRow key={cos.id}>
                        <TableCell className="font-medium">{cos.cos_reference_number}</TableCell>
                        <TableCell>{cos.certificate_number || '-'}</TableCell>
                        <TableCell>{cos.license_number || '-'}</TableCell>
                        <TableCell>{cos.sponsor_company?.name || 'Unknown Company'}</TableCell>
                        <TableCell>{cos.assigned_date ? format(new Date(cos.assigned_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{cos.certified_date ? format(new Date(cos.certified_date), 'dd/MM/yyyy') : '-'}</TableCell>
                       <TableCell>
                         <Badge variant={cos.cos_status === 'Active' ? 'default' : 'secondary'}>
                           {cos.cos_status || 'Active'}
                         </Badge>
                       </TableCell>
                       <TableCell>{cos.sponsor_note || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions.canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument('cos', cos)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument('cos', cos.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificate of sponsorship available</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => handleAddDocument('cos')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First COS
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Form */}
      <ImmigrationDocumentForm
        isOpen={showDocumentForm}
        onClose={() => setShowDocumentForm(false)}
        employeeId={employee.id}
        documentType={documentType}
        document={editingDocument}
        onSuccess={() => {
          setShowDocumentForm(false);
          if (onDocumentUpdate) onDocumentUpdate();
        }}
      />
    </div>
  );
};