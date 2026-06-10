import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedImmigrationTab } from "./EnhancedImmigrationTab";
import { DocumentsList } from "./DocumentsList";
import { Globe, FileText } from "lucide-react";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  immigration_status?: 'pending_review' | 'approved' | 'rejected' | 'expired' | 'requires_renewal';
}

interface EmployeePassport {
  id: string;
  passport_number: string;
  place_of_birth?: string;
  issuing_authority?: string;
  issuing_country?: string;
  issuing_country_id: string;
  issue_date?: string;
  expiry_date: string;
  status?: string;
  is_current: boolean;
  document_path?: string;
  countries?: { name: string };
  created_at: string;
}

interface EmployeeVisa {
  id: string;
  visa_type_id?: string;
  visa_types?: { name: string };
  visa_number?: string;
  issuing_country_id: string;
  countries?: { name: string };
  issue_date?: string;
  expiry_date?: string;
  entry_date?: string;
  conditions?: string;
  is_current: boolean;
  document_path?: string;
  created_at: string;
}

interface EmployeeRTWDocument {
  id: string;
  rtw_reference?: string;
  rtw_status?: string;
  share_code?: string;
  checked_date?: string;
  expiry_date?: string;
  is_current_active: boolean;
  status: string;
  document_path?: string;
  notes?: string;
  created_at: string;
}

interface EmployeeCOSDocument {
  id: string;
  cos_reference_number: string;
  certificate_number?: string;
  license_number?: string;
  assigned_date?: string;
  certified_date?: string;
  cos_status?: string;
  sponsor_name?: string;
  sponsor_note?: string;
  document_path?: string;
  notes?: string;
  created_at: string;
}

interface EmployeeDocumentsImmigrationTabProps {
  employee: Employee;
  employeeId: string;
  passports: EmployeePassport[];
  visas: EmployeeVisa[];
  rtwDocuments: EmployeeRTWDocument[];
  cosDocuments: EmployeeCOSDocument[];
  onDocumentUpdate?: () => void;
}

export const EmployeeDocumentsImmigrationTab = ({ 
  employee,
  employeeId,
  passports,
  visas,
  rtwDocuments,
  cosDocuments,
  onDocumentUpdate
}: EmployeeDocumentsImmigrationTabProps) => {
  const [activeTab, setActiveTab] = useState("immigration");

  

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="immigration" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Immigration
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="immigration">
        <EnhancedImmigrationTab 
          employee={employee}
          passports={passports}
          visas={visas}
          rtwDocuments={rtwDocuments}
          cosDocuments={cosDocuments}
          onDocumentUpdate={onDocumentUpdate}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsList 
          employeeId={employeeId}
          onDocumentUpdate={onDocumentUpdate}
        />
      </TabsContent>
    </Tabs>
  );
};