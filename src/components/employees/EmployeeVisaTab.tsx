import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreditCard, FileText, AlertTriangle, CheckCircle, Clock, Plus, Edit, Archive, Trash2 } from "lucide-react";
import { RestrictedAccess } from "./RestrictedAccess";
import { VisaForm } from "./VisaForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Visa {
  id: string;
  visa_number: string;
  visa_type: string;
  issuing_country: string;
  issue_date?: string;
  expiry_date?: string;
  is_current: boolean;
  conditions?: string;
  document_path?: string;
}

interface EmployeeVisaTabProps {
  employeeId: string;
  visas: Visa[];
  onUpdate: () => void;
}

export const EmployeeVisaTab = ({ employeeId, visas, onUpdate }: EmployeeVisaTabProps) => {
  const { getVisaPermissions } = usePermissions();
  const permissions = getVisaPermissions();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingVisa, setEditingVisa] = useState<Visa | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; visa?: Visa }>({ isOpen: false });
  const [loading, setLoading] = useState(false);
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired', color: 'destructive', icon: AlertTriangle };
    if (daysUntilExpiry <= 30) return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, color: 'outline', icon: Clock };
    return { status: 'valid', text: 'Valid', color: 'default', icon: CheckCircle };
  };

  const getStatusIcon = (expiryDate?: string) => {
    const status = getExpiryStatus(expiryDate);
    if (!status) return <CreditCard className="h-4 w-4 text-gray-600" />;
    
    const IconComponent = status.icon;
    const colorClass = status.status === 'expired' ? 'text-red-600' : 
                     status.status === 'expiring' ? 'text-yellow-600' : 'text-green-600';
    
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
  };

  const handleAdd = () => {
    setEditingVisa(undefined);
    setShowForm(true);
  };

  const handleEdit = (visa: Visa) => {
    setEditingVisa(visa);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.visa) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_visas")
        .delete()
        .eq("id", deleteDialog.visa.id);
      
      if (error) throw error;
      
      toast({ title: "Visa deleted successfully" });
      onUpdate();
      setDeleteDialog({ isOpen: false });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete visa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (visa: Visa) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_visas")
        .update({ is_current: false })
        .eq("id", visa.id);
      
      if (error) throw error;
      
      toast({ title: "Visa archived successfully" });
      onUpdate();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive visa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canView) {
    return (
      <RestrictedAccess 
        title="Visa Documents Access Restricted"
        message="You don't have permission to view visa documents. Only HR and Admin roles can access immigration information."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Visa Overview */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Visa Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {visas.filter(visa => visa.is_current).length}
              </div>
              <p className="text-sm text-muted-foreground">Current Visas</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {visas.filter(visa => {
                  const status = getExpiryStatus(visa.expiry_date);
                  return status?.status === 'valid';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Valid Visas</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {visas.filter(visa => {
                  const status = getExpiryStatus(visa.expiry_date);
                  return status?.status === 'expiring';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {visas.filter(visa => {
                  const status = getExpiryStatus(visa.expiry_date);
                  return status?.status === 'expired';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expired Visas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visa Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visa Documents
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {visas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2" />
              <p>No visa documents found</p>
              <p className="text-sm">Visa information will appear here once available</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Visa
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visas.map((visa) => {
                const expiryStatus = getExpiryStatus(visa.expiry_date);
                
                return (
                  <div
                    key={visa.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(visa.expiry_date)}
                        <div>
                          <h3 className="font-semibold">Visa Number: {visa.visa_number}</h3>
                          <p className="text-sm text-muted-foreground">Type: {visa.visa_type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {expiryStatus && (
                          <Badge variant={expiryStatus.color as any}>
                            {expiryStatus.text}
                          </Badge>
                        )}
                        {visa.is_current && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issuing Country:</span>
                        <span className="ml-2">{visa.issuing_country}</span>
                      </div>
                      
                      {visa.issue_date && (
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span className="ml-2">{format(new Date(visa.issue_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      {visa.expiry_date && (
                        <div>
                          <span className="text-muted-foreground">Expiry Date:</span>
                          <span className="ml-2">{format(new Date(visa.expiry_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-muted-foreground">Visa Type:</span>
                        <span className="ml-2 font-medium">{visa.visa_type}</span>
                      </div>
                    </div>

                    {visa.conditions && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <span className="text-muted-foreground font-medium">Conditions:</span>
                        <p className="mt-1">{visa.conditions}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {visa.document_path && (
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Visa Document
                        </Button>
                      )}
                      {permissions.canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(visa)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {permissions.canArchive && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(visa)} disabled={loading}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ isOpen: true, visa })}>
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

      <VisaForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => {
          onUpdate();
          setShowForm(false);
        }}
        employeeId={employeeId}
        visa={editingVisa}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visa</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this visa? This action cannot be undone.
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