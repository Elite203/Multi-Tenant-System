import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BookOpen as PassportIcon, FileText, AlertTriangle, CheckCircle, Clock, Plus, Edit, Archive, Trash2 } from "lucide-react";
import { RestrictedAccess } from "./RestrictedAccess";
import { PassportForm } from "./PassportForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Passport {
  id: string;
  passport_number: string;
  issuing_country: string;
  issue_date?: string;
  expiry_date?: string;
  status: string;
  is_current: boolean;
  document_path?: string;
}

interface EmployeePassportTabProps {
  employeeId: string;
  passports: Passport[];
  onUpdate: () => void;
}

export const EmployeePassportTab = ({ employeeId, passports, onUpdate }: EmployeePassportTabProps) => {
  const { getPassportPermissions } = usePermissions();
  const permissions = getPassportPermissions();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPassport, setEditingPassport] = useState<Passport | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; passport?: Passport }>({ isOpen: false });
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string, expiryDate?: string) => {
    const expiryStatus = getExpiryStatus(expiryDate);
    if (expiryStatus) {
      const IconComponent = expiryStatus.icon;
      const colorClass = expiryStatus.status === 'expired' ? 'text-red-600' : 
                       expiryStatus.status === 'expiring' ? 'text-yellow-600' : 'text-green-600';
      return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
    }
    
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <PassportIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAdd = () => {
    setEditingPassport(undefined);
    setShowForm(true);
  };

  const handleEdit = (passport: Passport) => {
    setEditingPassport(passport);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.passport) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_passports")
        .delete()
        .eq("id", deleteDialog.passport.id);
      
      if (error) throw error;
      
      toast({ title: "Passport deleted successfully" });
      onUpdate();
      setDeleteDialog({ isOpen: false });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete passport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (passport: Passport) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_passports")
        .update({ status: "cancelled" })
        .eq("id", passport.id);
      
      if (error) throw error;
      
      toast({ title: "Passport archived successfully" });
      onUpdate();
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive passport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canView) {
    return (
      <RestrictedAccess 
        title="Passport Documents Access Restricted"
        message="You don't have permission to view passport documents. Only HR and Admin roles can access immigration information."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Passport Overview */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PassportIcon className="h-5 w-5" />
            Passport Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {passports.filter(passport => passport.is_current).length}
              </div>
              <p className="text-sm text-muted-foreground">Current Passport</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {passports.filter(passport => passport.status === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active Passports</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {passports.filter(passport => {
                  const status = getExpiryStatus(passport.expiry_date);
                  return status?.status === 'expiring';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {passports.filter(passport => {
                  const status = getExpiryStatus(passport.expiry_date);
                  return status?.status === 'expired';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Expired Passports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passport Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Passport Documents
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Passport
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {passports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PassportIcon className="h-8 w-8 mx-auto mb-2" />
              <p>No passport documents found</p>
              <p className="text-sm">Passport information will appear here once available</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Passport
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {passports.map((passport) => {
                const expiryStatus = getExpiryStatus(passport.expiry_date);
                
                return (
                  <div
                    key={passport.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(passport.status, passport.expiry_date)}
                        <div>
                          <h3 className="font-semibold">Passport Number: {passport.passport_number}</h3>
                          <p className="text-sm text-muted-foreground">Issuing Country: {passport.issuing_country}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(passport.status)}>
                          {passport.status}
                        </Badge>
                        {expiryStatus && (
                          <Badge variant={expiryStatus.color as any}>
                            {expiryStatus.text}
                          </Badge>
                        )}
                        {passport.is_current && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issuing Country:</span>
                        <span className="ml-2 font-medium">{passport.issuing_country}</span>
                      </div>
                      
                      {passport.issue_date && (
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span className="ml-2">{format(new Date(passport.issue_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      {passport.expiry_date && (
                        <div>
                          <span className="text-muted-foreground">Expiry Date:</span>
                          <span className="ml-2">{format(new Date(passport.expiry_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {passport.document_path && (
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Passport Document
                        </Button>
                      )}
                      {permissions.canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(passport)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {permissions.canArchive && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(passport)} disabled={loading}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ isOpen: true, passport })}>
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

      <PassportForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => {
          onUpdate();
          setShowForm(false);
        }}
        employeeId={employeeId}
        passport={editingPassport}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passport</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this passport? This action cannot be undone.
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