import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Calendar, FileText, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { PayslipForm } from "./PayslipForm";

interface Payslip {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  status: string;
  notes: string | null;
  attachment_path: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeePayslipsTabProps {
  employeeId: string;
  onPayslipUpdate?: () => void;
}

export const EmployeePayslipsTab = ({ employeeId, onPayslipUpdate }: EmployeePayslipsTabProps) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
  const { toast } = useToast();
  const { getPayslipPermissions } = usePermissions();
  const permissions = getPayslipPermissions();

  useEffect(() => {
    fetchPayslips();
  }, [employeeId]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setPayslips(data || []);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: "Error",
        description: "Failed to load payslips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'final':
        return 'default'; // Green success
      case 'draft':
        return 'secondary'; // Yellow/amber warning
      case 'processing':
        return 'outline'; // Blue info
      default:
        return 'secondary';
    }
  };

  const handleFormSuccess = () => {
    fetchPayslips();
    if (onPayslipUpdate) {
      onPayslipUpdate();
    }
    setEditingPayslip(null);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
      });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: "Failed to download payslip",
        variant: "destructive",
      });
    }
  };

  const handleAddPayslip = () => {
    setEditingPayslip(null);
    setFormOpen(true);
  };

  const handleEditPayslip = (payslip: Payslip) => {
    setEditingPayslip(payslip);
    setFormOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading payslips...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant hover:shadow-hero">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            Payslips
          </CardTitle>
          {permissions.canCreate && (
            <Button variant="outline" size="sm" onClick={handleAddPayslip}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payslip
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payslips.length > 0 ? (
            <div className="space-y-4">
              {payslips.map((payslip) => (
                <div key={payslip.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold">
                          {getMonthName(payslip.month)} {payslip.year}
                        </h4>
                        <Badge variant={getStatusVariant(payslip.status)}>
                          {payslip.status}
                        </Badge>
                      </div>
                      {payslip.notes && (
                        <p className="text-sm text-muted-foreground">{payslip.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(payslip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payslip.attachment_path && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(payslip.attachment_path!, `payslip-${getMonthName(payslip.month)}-${payslip.year}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {permissions.canUpdate && (
                        <Button variant="outline" size="sm" onClick={() => handleEditPayslip(payslip)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {payslip.attachment_path && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Attachment available
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payslips available</p>
              {permissions.canCreate && (
                <Button variant="outline" className="mt-2" onClick={handleAddPayslip}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Payslip
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PayslipForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        employeeId={employeeId}
        payslip={editingPayslip}
      />
    </div>
  );
};