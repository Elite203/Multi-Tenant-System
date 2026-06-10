import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface EmployeeTabGroupProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export const EmployeeTabGroup = ({ tabs, defaultTab, className }: EmployeeTabGroupProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <TabsList className="w-full">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="mt-4">
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};