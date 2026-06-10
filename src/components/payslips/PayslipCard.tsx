import { Eye, Download, Edit, Trash2, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface PayslipCardProps {
  payslip: Payslip;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export const PayslipCard = ({ payslip, onView, onEdit, onDelete, permissions }: PayslipCardProps) => {
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
    if (amount === undefined || amount === null) return "N/A";
    return `£${amount.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              {payslip.employee?.first_name} {payslip.employee?.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {payslip.employee?.employee_number}
            </p>
            <p className="text-sm font-medium">{payslip.period}</p>
          </div>
          <Badge variant={getStatusVariant(payslip.status)} className="capitalize">
            {payslip.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Financial Information Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">Net Pay</span>
            </div>
            <p className="text-lg font-bold text-success">
              {formatCurrency(payslip.net_pay)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pay Date</span>
            </div>
            <p className="text-sm font-medium">
              {formatDate(payslip.pay_date)}
            </p>
          </div>

          {payslip.tax !== undefined && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Tax</span>
              <p className="text-sm font-medium text-destructive">
                {formatCurrency(payslip.tax)}
              </p>
            </div>
          )}

          {payslip.ni !== undefined && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">NI</span>
              <p className="text-sm font-medium text-destructive">
                {formatCurrency(payslip.ni)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>

          {payslip.file_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}

          {permissions.canUpdate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}

          {permissions.canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};