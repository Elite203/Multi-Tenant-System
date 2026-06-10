import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface Employee {
  passport_number: string | null;
  passport_expiry_date: string | null;
  visa_type: string | null;
  visa_expiry_date: string | null;
  right_to_work_expiry_date: string | null;
}

interface EmployeeImmigrationTabProps {
  employee: Employee;
}

export const EmployeeImmigrationTab = ({ employee }: EmployeeImmigrationTabProps) => {
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'destructive', icon: AlertTriangle };
    if (daysUntilExpiry <= 90) return { status: 'expiring-soon', color: 'secondary', icon: AlertTriangle };
    return { status: 'valid', color: 'default', icon: CheckCircle };
  };

  const passportStatus = getExpiryStatus(employee.passport_expiry_date);
  const visaStatus = getExpiryStatus(employee.visa_expiry_date);
  const rtwStatus = getExpiryStatus(employee.right_to_work_expiry_date);

  return (
    <div className="space-y-6">
      {/* Immigration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Immigration Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {passportStatus ? (
                  <passportStatus.icon className={`h-6 w-6 ${passportStatus.color === 'destructive' ? 'text-destructive' : passportStatus.color === 'secondary' ? 'text-amber-500' : 'text-green-500'}`} />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="font-medium">Passport</p>
              <p className="text-sm text-muted-foreground">
                {employee.passport_expiry_date ? new Date(employee.passport_expiry_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {visaStatus ? (
                  <visaStatus.icon className={`h-6 w-6 ${visaStatus.color === 'destructive' ? 'text-destructive' : visaStatus.color === 'secondary' ? 'text-amber-500' : 'text-green-500'}`} />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="font-medium">Visa</p>
              <p className="text-sm text-muted-foreground">
                {employee.visa_expiry_date ? new Date(employee.visa_expiry_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {rtwStatus ? (
                  <rtwStatus.icon className={`h-6 w-6 ${rtwStatus.color === 'destructive' ? 'text-destructive' : rtwStatus.color === 'secondary' ? 'text-amber-500' : 'text-green-500'}`} />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="font-medium">Right to Work</p>
              <p className="text-sm text-muted-foreground">
                {employee.right_to_work_expiry_date ? new Date(employee.right_to_work_expiry_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passport Information */}
        <Card>
          <CardHeader>
            <CardTitle>Passport Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Passport Number</label>
              <p className="mt-1 font-mono text-sm">
                {employee.passport_number || 'Not provided'}
              </p>
            </div>
            {employee.passport_expiry_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(employee.passport_expiry_date).toLocaleDateString()}</span>
                  {passportStatus && (
                    <Badge variant={passportStatus.color as any}>
                      {passportStatus.status === 'expired' ? 'Expired' : 
                       passportStatus.status === 'expiring-soon' ? 'Expiring Soon' : 'Valid'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visa Information */}
        <Card>
          <CardHeader>
            <CardTitle>Visa Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Visa Type</label>
              <p className="mt-1">{employee.visa_type || 'Not provided'}</p>
            </div>
            {employee.visa_expiry_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(employee.visa_expiry_date).toLocaleDateString()}</span>
                  {visaStatus && (
                    <Badge variant={visaStatus.color as any}>
                      {visaStatus.status === 'expired' ? 'Expired' : 
                       visaStatus.status === 'expiring-soon' ? 'Expiring Soon' : 'Valid'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right to Work Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Right to Work Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.right_to_work_expiry_date ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Right to Work Expiry Date</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(employee.right_to_work_expiry_date).toLocaleDateString()}</span>
                  {rtwStatus && (
                    <Badge variant={rtwStatus.color as any}>
                      {rtwStatus.status === 'expired' ? 'Expired' : 
                       rtwStatus.status === 'expiring-soon' ? 'Expiring Soon' : 'Valid'}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No right to work information provided</p>
                <p className="text-sm">Please update employee record with RTW details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};