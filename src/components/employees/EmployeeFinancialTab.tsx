import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building, Eye, EyeOff, Plus, Edit, Trash2, Archive } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BankDetailsForm } from "./BankDetailsForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  salary?: number;
  national_insurance_number?: string;
}

interface EmployeeBankDetails {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  bank_address?: string;
  currency_code?: string;
  verification_status?: string;
  verified_at?: string;
  verified_by?: string;
  is_primary: boolean;
  is_active: boolean;
}

interface EmployeeFinancialTabProps {
  employee: Employee;
  bankDetails: EmployeeBankDetails[];
  canManage: boolean;
  onBankDetailsUpdate?: () => void;
}

export const EmployeeFinancialTab = ({ employee, bankDetails, canManage, onBankDetailsUpdate }: EmployeeFinancialTabProps) => {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState<EmployeeBankDetails | undefined>();
  const { getFinancialPermissions } = usePermissions();
  const { toast } = useToast();

  const permissions = getFinancialPermissions();

  const maskAccountNumber = (accountNumber: string) => {
    if (!showSensitiveData) {
      return `****${accountNumber.slice(-4)}`;
    }
    return accountNumber;
  };

  const maskNationalInsurance = (ni?: string) => {
    if (!ni || !showSensitiveData) {
      return ni ? `${ni.substring(0, 2)}***${ni.slice(-2)}` : 'Not provided';
    }
    return ni;
  };

  const handleArchiveBank = async (bankId: string) => {
    if (!confirm("Are you sure you want to archive this bank account?")) return;

    try {
      const { error } = await supabase
        .from("employee_bank_details")
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq("id", bankId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Bank details archived successfully",
      });
      if (onBankDetailsUpdate) onBankDetailsUpdate();
    } catch (error) {
      console.error("Error archiving bank details:", error);
      toast({
        title: "Error",
        description: "Failed to archive bank details",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm("Are you sure you want to permanently delete this bank account?")) return;

    try {
      const { error } = await supabase
        .from("employee_bank_details")
        .delete()
        .eq("id", bankId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Bank details deleted successfully",
      });
      if (onBankDetailsUpdate) onBankDetailsUpdate();
    } catch (error) {
      console.error("Error deleting bank details:", error);
      toast({
        title: "Error",
        description: "Failed to delete bank details",
        variant: "destructive",
      });
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Access restricted</p>
          <p className="text-sm text-muted-foreground">You don't have permission to view financial information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Financial Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center gap-2"
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Annual Salary</label>
                <p className="text-lg font-semibold">
                  {employee.salary ? `£${employee.salary.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">National Insurance Number</label>
                <p className="font-mono">
                  {maskNationalInsurance(employee.national_insurance_number)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Details
          </CardTitle>
          {permissions.canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingBank(undefined);
                setShowBankForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Details
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {bankDetails.length > 0 ? (
            <div className="space-y-4">
              {bankDetails.map((bank) => (
                <div key={bank.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{bank.bank_name}</h4>
                      <p className="text-sm text-muted-foreground">{bank.account_holder_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {bank.is_primary && (
                        <Badge className="bg-blue-500">Primary</Badge>
                      )}
                      <Badge className={bank.is_active ? "bg-green-500" : "bg-secondary"}>
                        {bank.is_active ? "Active" : "Inactive"}
                      </Badge>
                      
                      {permissions.canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBank(bank);
                            setShowBankForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {permissions.canArchive && bank.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveBank(bank.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBank(bank.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <div>
                       <span className="font-medium">Account Number:</span>
                       <p className="font-mono">{showSensitiveData ? bank.account_number : maskAccountNumber(bank.account_number)}</p>
                     </div>
                     {bank.sort_code && (
                       <div>
                         <span className="font-medium">Sort Code:</span>
                         <p className="font-mono">{bank.sort_code}</p>
                       </div>
                     )}
                     {bank.iban && (
                       <div>
                         <span className="font-medium">IBAN:</span>
                         <p className="font-mono">{showSensitiveData ? bank.iban : `****${bank.iban.slice(-4)}`}</p>
                       </div>
                     )}
                     {bank.swift_code && (
                       <div>
                         <span className="font-medium">SWIFT Code:</span>
                         <p className="font-mono">{bank.swift_code}</p>
                       </div>
                     )}
                     {bank.bank_address && (
                       <div>
                         <span className="font-medium">Bank Address:</span>
                         <p className="text-sm">{bank.bank_address}</p>
                       </div>
                     )}
                     {bank.currency_code && (
                       <div>
                         <span className="font-medium">Currency:</span>
                         <p className="font-semibold">{bank.currency_code}</p>
                       </div>
                     )}
                     {bank.verification_status && (
                       <div>
                         <span className="font-medium">Verification Status:</span>
                         <Badge variant={bank.verification_status === 'verified' ? 'default' : 'secondary'}>
                           {bank.verification_status}
                         </Badge>
                       </div>
                     )}
                     {bank.verified_at && (
                       <div>
                         <span className="font-medium">Verified On:</span>
                         <p className="text-sm">{new Date(bank.verified_at).toLocaleDateString()}</p>
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank details recorded</p>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setEditingBank(undefined);
                    setShowBankForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Details
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details Form */}
      <BankDetailsForm
        isOpen={showBankForm}
        onClose={() => {
          setShowBankForm(false);
          setEditingBank(undefined);
        }}
        employeeId={employee.id}
        bankDetails={editingBank}
        onSuccess={() => {
          if (onBankDetailsUpdate) onBankDetailsUpdate();
        }}
      />
    </div>
  );
};