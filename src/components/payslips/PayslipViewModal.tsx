import { Download, Calendar, CreditCard, Receipt, User, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayslipExtractor } from "@/services/payslipExtractor";
import { useToast } from "@/hooks/use-toast";

interface Payslip {
  id: string;
  employee_id: string;
  period: string;
  net_pay?: number;
  gross_pay?: number;
  tax?: number;
  ni?: number;
  pension?: number;
  other_deductions?: number;
  pay_date?: string;
  status: string;
  file_url?: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface PayslipViewModalProps {
  payslip: Payslip;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipViewModal = ({ payslip, isOpen, onClose }: PayslipViewModalProps) => {
  const { toast } = useToast();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleDownload = async () => {
    if (!payslip.file_url) {
      toast({
        title: "No file available",
        description: "This payslip doesn't have a file attached.",
        variant: "destructive",
      });
      return;
    }

    try {
      const signedUrl = await PayslipExtractor.getSignedUrl(payslip.file_url);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download the payslip file.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "£0.00";
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDeductions = () => {
    const tax = payslip.tax || 0;
    const ni = payslip.ni || 0;
    const pension = payslip.pension || 0;
    const otherDeductions = payslip.other_deductions || 0;
    return tax + ni + pension + otherDeductions;
  };

  const calculateTakeHomePercentage = () => {
    if (!payslip.gross_pay || payslip.gross_pay === 0) return 0;
    const netPay = payslip.net_pay || 0;
    return Math.round((netPay / payslip.gross_pay) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Payslip Details</DialogTitle>
                <DialogDescription>
                  Payslip for {payslip.employee?.first_name} {payslip.employee?.last_name} - {payslip.period}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={getStatusVariant(payslip.status)} className="capitalize">
              {payslip.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee and Period Information */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Employee</span>
                </div>
                <p className="font-semibold">
                  {payslip.employee?.first_name} {payslip.employee?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {payslip.employee?.employee_number}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Period</span>
                </div>
                <p className="font-semibold">{payslip.period}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Pay Date</span>
                </div>
                <p className="text-sm">{formatDate(payslip.pay_date)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CreditCard className="h-5 w-5" />
                Net Pay Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(payslip.net_pay)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Take home pay ({calculateTakeHomePercentage()}% of gross)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gross Pay</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(payslip.gross_pay)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deductions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payslip.tax !== undefined && payslip.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Income Tax</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(payslip.tax)}
                    </span>
                  </div>
                )}
                
                {payslip.ni !== undefined && payslip.ni > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">National Insurance</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(payslip.ni)}
                    </span>
                  </div>
                )}
                
                {payslip.pension !== undefined && payslip.pension > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pension</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(payslip.pension)}
                    </span>
                  </div>
                )}
                
                {payslip.other_deductions !== undefined && payslip.other_deductions > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other Deductions</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(payslip.other_deductions)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-destructive">
                      -{formatCurrency(calculateDeductions())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File Download Section */}
          {payslip.file_url && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Payslip Document</p>
                      <p className="text-sm text-muted-foreground">
                        Download the original payslip PDF
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {payslip.file_url && (
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};