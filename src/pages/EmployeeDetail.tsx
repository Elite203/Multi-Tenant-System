import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout/Layout";
import { EmployeeDetailHeader } from "@/components/employees/EmployeeDetailHeader";
import { EmployeeTabsContainer } from "@/components/employees/EmployeeTabsContainer";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PassportDocument, VisaDocument, RTWDocument, COSDocument, BankDetail, CertificationRecord, TrainingRecord, EducationRecord, LeaveBalance } from "@/types/employeeDocuments";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  hire_date: string;
  start_date?: string;
  job_title_name: string;
  department_name: string;
  company_name: string;
  status: string;
  salary?: number;
  national_insurance_number?: string;
  immigration_status?: string;
  current_nationality_name?: string;
  sponsored_by_company_name?: string;
  compliance_score?: number;
  profile_photo_url?: string;
  manager_id?: string;
  manager_name?: string;
  direct_reports_count?: number;
  // Database fields for compatibility
  employee_type?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  // Related data arrays
  passports?: PassportDocument[];
  visas?: VisaDocument[];
  rtw_documents?: RTWDocument[];
  cos_documents?: COSDocument[];
  bank_details?: BankDetail[];
  certifications?: CertificationRecord[];
  training?: TrainingRecord[];
  education?: EducationRecord[];
  leave_balances?: LeaveBalance[];
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchEmployeeData = async () => {
    if (!id) {
      console.log('No employee ID provided');
      return;
    }

    // Validate ID format
    if (id === 'null' || id === 'undefined' || !isValidUUID(id)) {
      console.error('Invalid employee ID:', id);
      toast({
        title: "Invalid Employee ID",
        description: "The employee ID is not valid. Redirecting to employees list.",
        variant: "destructive",
      });
      navigate('/employees');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching employee data for ID:', id);
      
      // Get complete employee data using the database function
      const { data, error } = await supabase.rpc('get_employee_complete', {
        employee_uuid: id
      });

      if (error) {
        console.error('Error fetching employee:', error);
        toast({
          title: "Error",
          description: "Failed to load employee details",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "Employee not found",
          variant: "destructive",
        });
        return;
      }

      setEmployee(data as unknown as Employee);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const handleEmployeeUpdate = () => {
    fetchEmployeeData();
    setShowEditDialog(false);
    toast({
      title: "Success",
      description: "Employee updated successfully",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-6 py-6 space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="w-full px-6 py-6">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold text-muted-foreground">Employee Not Found</h1>
            <p className="text-muted-foreground mt-2">The requested employee could not be found.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-6 py-6 space-y-6 animate-fade-in">
        <EmployeeDetailHeader 
          employee={employee}
          onEditClick={() => setShowEditDialog(true)}
        />
        
        <EmployeeTabsContainer 
          employee={employee}
          onEmployeeUpdate={fetchEmployeeData}
        />

        <EditEmployeeDialog
          employee={{
            ...employee,
            employee_type: employee.employee_type || 'staff' as any,
            company_id: employee.company_id || '',
            created_at: employee.created_at || new Date().toISOString(),
            updated_at: employee.updated_at || new Date().toISOString()
          }}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onEmployeeUpdated={handleEmployeeUpdate}
        />
      </div>
    </Layout>
  );
}