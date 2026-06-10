import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Briefcase, Globe, FileText, Users } from 'lucide-react';
import { DepartmentsManagement } from './DepartmentsManagement';
import { JobTitlesManagement } from './JobTitlesManagement';
import { CountriesManagement } from './CountriesManagement';
import { VisaTypesManagement } from './VisaTypesManagement';
import { EmployeeTypesManagement } from './EmployeeTypesManagement';

interface MetadataManagementProps {
  isUpdating: boolean;
}

export function MetadataManagement({ isUpdating }: MetadataManagementProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-card p-6 shadow-hero">
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
          Metadata Management
        </h2>
        <p className="text-lg text-muted-foreground">
          Manage organizational metadata including departments, job titles, employee types, countries, and visa types
        </p>
      </div>

      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-gradient-card rounded-2xl p-1 shadow-sm">
          <TabsTrigger value="departments" className="flex items-center space-x-2 rounded-xl transition-all hover:bg-primary/20">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="job-titles" className="flex items-center space-x-2 rounded-xl transition-all hover:bg-primary/20">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Job Titles</span>
          </TabsTrigger>
          <TabsTrigger value="employee-types" className="flex items-center space-x-2 rounded-xl transition-all hover:bg-primary/20">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Employee Types</span>
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center space-x-2 rounded-xl transition-all hover:bg-primary/20">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Countries</span>
          </TabsTrigger>
          <TabsTrigger value="visa-types" className="flex items-center space-x-2 rounded-xl transition-all hover:bg-primary/20">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Visa Types</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsManagement isUpdating={isUpdating} />
        </TabsContent>

        <TabsContent value="job-titles">
          <JobTitlesManagement isUpdating={isUpdating} />
        </TabsContent>

        <TabsContent value="employee-types">
          <EmployeeTypesManagement isUpdating={isUpdating} />
        </TabsContent>

        <TabsContent value="countries">
          <CountriesManagement isUpdating={isUpdating} />
        </TabsContent>

        <TabsContent value="visa-types">
          <VisaTypesManagement isUpdating={isUpdating} />
        </TabsContent>
      </Tabs>
    </div>
  );
}