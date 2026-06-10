import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, TrendingUp, FileText } from "lucide-react";
import { OrgChartContent } from "@/components/organization/OrgChartContent";
import { TeamAnalytics } from "@/components/employees/TeamAnalytics";
import { AdvancedAnalytics } from "@/components/employees/AdvancedAnalytics";
import { ReportBuilder } from "@/components/employees/ReportBuilder";

const OrganizationPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organization Chart
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Team Analytics
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Advanced Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <OrgChartContent />
          </TabsContent>

          <TabsContent value="analytics">
            <TeamAnalytics />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <ReportBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OrganizationPage;