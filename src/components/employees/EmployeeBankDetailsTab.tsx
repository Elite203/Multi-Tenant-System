import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { BankDetailsForm } from "./BankDetailsForm";
import { RestrictedAccess } from "./RestrictedAccess";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BankDetail {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  currency_code?: string;
  verification_status?: string;
  is_primary: boolean;
  is_active: boolean;
}

interface EmployeeBankDetailsTabProps {
  employeeId: string;
  bankDetails: BankDetail[];
  onUpdate: () => void;
}

export const EmployeeBankDetailsTab = ({ employeeId, bankDetails, onUpdate }: EmployeeBankDetailsTabProps) => {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetail | undefined>();
  const { getFinancialPermissions } = usePermissions();
  const permissions = getFinancialPermissions();
  const { toast } = useToast();

  const maskAccountNumber = (accountNumber: string) => {
    if (!showSensitiveData) {
      return '****' + accountNumber.slice(-4);
    }
    return accountNumber;
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!permissions.canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete bank details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_bank_details')
        .delete()
        .eq('id', bankId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank details deleted successfully",
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting bank details:', error);
      toast({
        title: "Error",
        description: "Failed to delete bank details",
        variant: "destructive",
      });
    }
  };

  const handleArchiveBank = async (bankId: string) => {
    if (!permissions.canArchive) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to archive bank details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_bank_details')
        .update({ is_active: false })
        .eq('id', bankId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank details archived successfully",
      });
      onUpdate();
    } catch (error) {
      console.error('Error archiving bank details:', error);
      toast({
        title: "Error",
        description: "Failed to archive bank details",
        variant: "destructive",
      });
    }
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'default';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!permissions.canView) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2" />
            <p>Access Restricted</p>
            <p className="text-sm">You don't have permission to view financial information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!permissions.canView) {
    return (
      <RestrictedAccess 
        title="Bank Details Access Restricted"
        message="You don't have permission to view bank details. Only HR and Admin roles can access financial information."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bank Details Overview */}
      <Card className="border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant bg-gradient-to-r from-background/50 to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSensitiveData ? 'Hide' : 'Show'} Details
              </Button>
              {permissions.canCreate && (
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {bankDetails.filter(bank => bank.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Accounts</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {bankDetails.filter(bank => bank.is_primary).length}
              </div>
              <p className="text-sm text-muted-foreground">Primary Account</p>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {bankDetails.filter(bank => bank.verification_status === 'verified').length}
              </div>
              <p className="text-sm text-muted-foreground">Verified Accounts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {bankDetails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2" />
              <p>No bank details found</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Bank Account
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bankDetails.map((bank) => (
                <div
                  key={bank.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{bank.bank_name}</h3>
                      <p className="text-sm text-muted-foreground">{bank.account_holder_name}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {bank.verification_status && (
                        <Badge variant={getVerificationStatusColor(bank.verification_status)}>
                          {bank.verification_status}
                        </Badge>
                      )}
                      {bank.is_primary && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Primary
                        </Badge>
                      )}
                      {!bank.is_active && (
                        <Badge variant="secondary">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="ml-2 font-mono">{maskAccountNumber(bank.account_number)}</span>
                    </div>
                    
                    {bank.sort_code && (
                      <div>
                        <span className="text-muted-foreground">Sort Code:</span>
                        <span className="ml-2 font-mono">{bank.sort_code}</span>
                      </div>
                    )}
                    
                    {bank.iban && (
                      <div>
                        <span className="text-muted-foreground">IBAN:</span>
                        <span className="ml-2 font-mono">{showSensitiveData ? bank.iban : '****' + bank.iban.slice(-4)}</span>
                      </div>
                    )}
                    
                    {bank.currency_code && (
                      <div>
                        <span className="text-muted-foreground">Currency:</span>
                        <span className="ml-2">{bank.currency_code}</span>
                      </div>
                    )}
                  </div>

                  {bank.swift_code && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">SWIFT Code:</span>
                      <span className="ml-2 font-mono">{bank.swift_code}</span>
                    </div>
                  )}

                  {(permissions.canUpdate || permissions.canArchive || permissions.canDelete) && (
                    <div className="mt-3 flex items-center gap-2">
                      {permissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBank(bank);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      
                      {permissions.canArchive && bank.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveBank(bank.id)}
                        >
                          Archive
                        </Button>
                      )}
                      
                      {permissions.canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBank(bank.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BankDetailsForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBank(undefined);
        }}
        employeeId={employeeId}
        bankDetails={editingBank}
        onSuccess={() => {
          setShowForm(false);
          setEditingBank(undefined);
          onUpdate();
        }}
      />
    </div>
  );
};