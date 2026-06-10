import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, BarChart3 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { LeaveRequestsContent } from "@/components/leave/LeaveRequestsContent";
import { LeaveSettings } from "@/components/leave/LeaveSettings";

const Leave = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const { getLeavePermissions } = usePermissions();
  const permissions = getLeavePermissions();

  const tabs = [
    {
      value: "requests",
      label: "Leave Requests",
      icon: Calendar,
      component: <LeaveRequestsContent />,
      permission: true,
    },
    {
      value: "settings",
      label: "Settings",
      icon: Settings,
      component: <LeaveSettings />,
      permission: permissions.canUpdate,
    },
  ];

  const availableTabs = tabs.filter(tab => tab.permission);

  return (
    <Layout>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                Leave Management
              </h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive leave management system with approvals and analytics
              </p>
            </div>
          </div>

          <TabsList className="w-full max-w-md bg-gradient-to-r from-muted/50 to-muted/30">
            {availableTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            {availableTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                {tab.component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Leave;