import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Plus, Edit, Archive, Trash2 } from "lucide-react";
import { RestrictedAccess } from "./RestrictedAccess";
import { RTWDocumentForm } from "./RTWDocumentForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RTWDocument {
  id: string;
  rtw_reference: string;
  rtw_status: string;
  share_code?: string;
  checked_date?: string;
  expiry_date?: string;
  is_current_active: boolean;
  status: string;
  document_path?: string;
  notes?: string;
}

interface EmployeeRTWTabProps {
  employeeId: string;
  rtwDocuments: RTWDocument[];
  onUpdate: () => void;
}

export const EmployeeRTWTab = ({ employeeId, rtwDocuments, onUpdate }: EmployeeRTWTabProps) => {
  const { getRTWPermissions } = usePermissions();
  const permissions = getRTWPermissions();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<RTWDocument | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; document?: RTWDocument }>({ isOpen: false });
  const [loading, setLoading] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'valid':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'valid':
      case 'active':
        return 'default';
      case 'expired':
      case 'invalid':
        return 'destructive';
      case 'expiring':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired', color: 'destructive' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, color: 'outline' };
    return { status: 'valid', text: 'Valid', color: 'default' };
  };

  const handleAdd = () => {
    setEditingDocument(undefined);
    setShowForm(true);
  };

  const handleEdit = (document: RTWDocument) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.document) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_rtw_documents")
        .delete()
        .eq("id", deleteDialog.document.id);
      
      if (error) throw error;
      
      toast({ title: "RTW document deleted successfully" });
      onUpdate();
      setDeleteDialog({ isOpen: false });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete RTW document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (document: RTWDocument) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_rtw_documents")
        .update({ status: "Archived" })
        .eq("id", document.id);
      
      if (error) throw error;
      
      toast({ title: "RTW document archived successfully" });
      onUpdate();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive RTW document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canView) {
    return (
      <RestrictedAccess 
        title="RTW Documents Access Restricted"
        message="You don't have permission to view Right to Work documents. Only HR and Admin roles can access immigration information."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* RTW Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Right to Work Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {rtwDocuments.filter(doc => doc.is_current_active && doc.status === 'Active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active Documents</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {rtwDocuments.filter(doc => {
                  const expiryStatus = getExpiryStatus(doc.expiry_date);
                  return expiryStatus?.status === 'expiring';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {rtwDocuments.filter(doc => {
                  const expiryStatus = getExpiryStatus(doc.expiry_date);
                  return expiryStatus?.status === 'expired';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RTW Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            RTW Documents
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add RTW Document
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {rtwDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              <p>No RTW documents found</p>
              <p className="text-sm">Right to work documents will appear here once uploaded</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First RTW Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {rtwDocuments.map((document) => {
                const expiryStatus = getExpiryStatus(document.expiry_date);
                
                return (
                  <div
                    key={document.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(document.status)}
                        <div>
                          <h3 className="font-semibold">RTW Reference: {document.rtw_reference}</h3>
                          <p className="text-sm text-muted-foreground">Status: {document.rtw_status}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                        {document.is_current_active && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {document.share_code && (
                        <div>
                          <span className="text-muted-foreground">Share Code:</span>
                          <span className="ml-2 font-mono">{document.share_code}</span>
                        </div>
                      )}
                      
                      {document.checked_date && (
                        <div>
                          <span className="text-muted-foreground">Checked Date:</span>
                          <span className="ml-2">{format(new Date(document.checked_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      {document.expiry_date && (
                        <div>
                          <span className="text-muted-foreground">Expiry Date:</span>
                          <span className="ml-2">{format(new Date(document.expiry_date), 'MMM dd, yyyy')}</span>
                          {expiryStatus && (
                            <Badge variant={expiryStatus.color as any} className="ml-2 text-xs">
                              {expiryStatus.text}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {document.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1">{document.notes}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {document.document_path && (
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                      )}
                      {permissions.canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(document)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {permissions.canArchive && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(document)} disabled={loading}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ isOpen: true, document })}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <RTWDocumentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => {
          onUpdate();
          setShowForm(false);
        }}
        employeeId={employeeId}
        document={editingDocument}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RTW Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this RTW document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};