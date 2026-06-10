import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, TrendingUp, Download } from "lucide-react";
import { ReportBuilder } from "@/components/employees/ReportBuilder";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { ReportsAnalytics } from "@/components/reports/ReportsAnalytics";
import { ReportsHistory } from "@/components/reports/ReportsHistory";

const ReportsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and analytics across all modules
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Builder
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ReportsDashboard />
          </TabsContent>

          <TabsContent value="builder">
            <ReportBuilder />
          </TabsContent>

          <TabsContent value="analytics">
            <ReportsAnalytics />
          </TabsContent>

          <TabsContent value="history">
            <ReportsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;