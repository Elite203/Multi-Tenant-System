import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Upload, FileText, History, BookOpen, Download } from "lucide-react";
import { ImportUpload } from "./ImportUpload";
import { TemplateManager } from "./TemplateManager";
import { ImportHistory } from "./ImportHistory";
import { ImportGuide } from "./ImportGuide";
import { ImportStatsCards } from "./ImportStatsCards";

export function DataImportContent() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("import");

  // Check if user has admin access
  const hasAdminAccess = profile?.role === 'admin';

  if (!hasAdminAccess) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Data Import
          </h1>
          <p className="text-muted-foreground mt-2">
            Import data from CSV files with validation and preview
          </p>
        </div>

        <Card className="mx-auto max-w-md shadow-soft border-0">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Data import functionality requires administrator privileges. 
              Please contact your system administrator for access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Data Import
        </h1>
        <p className="text-muted-foreground">
          Import data from CSV files with validation and preview
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab("templates")}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Templates
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab("guide")}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Import Guide
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ImportStatsCards />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <ImportUpload />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistory />
        </TabsContent>

        <TabsContent value="guide">
          <ImportGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}