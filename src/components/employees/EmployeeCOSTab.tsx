import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Award, FileText, Calendar, Building, Plus, Edit, Archive, Trash2 } from "lucide-react";
import { RestrictedAccess } from "./RestrictedAccess";
import { COSForm } from "./COSForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface COSDocument {
  id: string;
  cos_reference_number: string;
  certificate_number?: string;
  license_number?: string;
  assigned_date?: string;
  certified_date?: string;
  cos_status: string;
  sponsor_note?: string;
  document_path?: string;
  notes?: string;
}

interface EmployeeCOSTabProps {
  employeeId: string;
  cosDocuments: COSDocument[];
  onUpdate: () => void;
}

export const EmployeeCOSTab = ({ employeeId, cosDocuments, onUpdate }: EmployeeCOSTabProps) => {
  const { getCOSPermissions } = usePermissions();
  const permissions = getCOSPermissions();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<COSDocument | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; document?: COSDocument }>({ isOpen: false });
  const [loading, setLoading] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'used':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'inactive':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'used':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'expired':
        return <Calendar className="h-4 w-4 text-red-600" />;
      default:
        return <Building className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAdd = () => {
    setEditingDocument(undefined);
    setShowForm(true);
  };

  const handleEdit = (document: COSDocument) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.document) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_cos_documents")
        .delete()
        .eq("id", deleteDialog.document.id);
      
      if (error) throw error;
      
      toast({ title: "COS document deleted successfully" });
      onUpdate();
      setDeleteDialog({ isOpen: false });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete COS document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (document: COSDocument) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_cos_documents")
        .update({ cos_status: "Archived" })
        .eq("id", document.id);
      
      if (error) throw error;
      
      toast({ title: "COS document archived successfully" });
      onUpdate();
    } catch (error: Error | unknown) {
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to archive COS document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canView) {
    return (
      <RestrictedAccess 
        title="COS Documents Access Restricted"
        message="You don't have permission to view Certificate of Sponsorship documents. Only HR and Admin roles can access immigration information."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* COS Overview */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate of Sponsorship Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {cosDocuments.filter(doc => doc.cos_status === 'Active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active COS</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {cosDocuments.filter(doc => doc.cos_status === 'Used').length}
              </div>
              <p className="text-sm text-muted-foreground">Used COS</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {cosDocuments.filter(doc => doc.cos_status === 'Expired').length}
              </div>
              <p className="text-sm text-muted-foreground">Expired COS</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {cosDocuments.length}
              </div>
              <p className="text-sm text-muted-foreground">Total COS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COS Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            COS Documents
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add COS
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {cosDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <p>No COS documents found</p>
              <p className="text-sm">Certificate of Sponsorship documents will appear here once available</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First COS
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {cosDocuments.map((document) => (
                <div
                  key={document.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(document.cos_status)}
                      <div>
                        <h3 className="font-semibold">COS Reference: {document.cos_reference_number}</h3>
                        {document.certificate_number && (
                          <p className="text-sm text-muted-foreground">
                            Certificate: {document.certificate_number}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Badge variant={getStatusColor(document.cos_status)}>
                      {document.cos_status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {document.license_number && (
                      <div>
                        <span className="text-muted-foreground">License Number:</span>
                        <span className="ml-2 font-mono">{document.license_number}</span>
                      </div>
                    )}
                    
                    {document.assigned_date && (
                      <div>
                        <span className="text-muted-foreground">Assigned Date:</span>
                        <span className="ml-2">{format(new Date(document.assigned_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    
                    {document.certified_date && (
                      <div>
                        <span className="text-muted-foreground">Certified Date:</span>
                        <span className="ml-2">{format(new Date(document.certified_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {document.sponsor_note && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <span className="text-muted-foreground font-medium">Sponsor Note:</span>
                      <p className="mt-1">{document.sponsor_note}</p>
                    </div>
                  )}

                  {document.notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                      <span className="text-muted-foreground font-medium">Notes:</span>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <COSForm
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
            <AlertDialogTitle>Delete COS Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this COS document? This action cannot be undone.
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