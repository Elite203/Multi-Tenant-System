import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeEducationTab } from "./EmployeeEducationTab";
import { EmployeeTrainingTab } from "./EmployeeTrainingTab";
import { GraduationCap, Award } from "lucide-react";
import { EducationRecord } from "@/types/employeeDocuments";

interface EmployeeCertification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_active: boolean;
  requires_renewal: boolean;
  document_path?: string;
}

interface EmployeeTraining {
  id: string;
  training_name: string;
  training_provider?: string;
  training_type?: string;
  completion_date?: string;
  expiry_date?: string;
  score?: number;
  status: string;
  is_mandatory: boolean;
  document_path?: string;
  notes?: string;
}

interface EmployeeDevelopmentTabProps {
  employeeId: string;
  certifications: EmployeeCertification[];
  education: EducationRecord[];
  training: EmployeeTraining[];
  onCertificationUpdated?: () => void;
  onEducationUpdated?: () => void;
  onTrainingUpdated?: () => void;
}

export const EmployeeDevelopmentTab = ({ 
  employeeId,
  certifications,
  education,
  training,
  onCertificationUpdated,
  onEducationUpdated,
  onTrainingUpdated
}: EmployeeDevelopmentTabProps) => {
  return (
    <Tabs defaultValue="education" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="education" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Education & Certifications
        </TabsTrigger>
        <TabsTrigger value="training" className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Training
        </TabsTrigger>
      </TabsList>

      <TabsContent value="education">
        <EmployeeEducationTab 
          employeeId={employeeId} 
          certifications={certifications}
          education={education}
          onCertificationUpdated={onCertificationUpdated}
          onEducationUpdated={onEducationUpdated}
        />
      </TabsContent>

      <TabsContent value="training">
        <EmployeeTrainingTab 
          employeeId={employeeId} 
          training={training}
          onTrainingUpdated={onTrainingUpdated}
        />
      </TabsContent>
    </Tabs>
  );
};