import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Shield, 
  Bell, 
  Mail, 
  Clock, 
  Megaphone, 
  Database, 
  BarChart3,
  Palette,
  Building,
  Calendar,
  Users
} from 'lucide-react';

// Import setting components
import { EnhancedGeneralSettingsCard } from './EnhancedGeneralSettingsCard';
import { MetadataManagement } from './MetadataManagement';
import { LeaveSettingsCard } from './LeaveSettingsCard';
import { FiscalYearSettings } from './FiscalYearSettings';
import { EmailSettingsCard } from './EmailSettingsCard';
import { RotaSettingsCard } from './RotaSettingsCard';
import { SecuritySettingsCard } from './SecuritySettingsCard';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { AnnouncementSettings } from './AnnouncementSettings';
import { EmailLogsViewer } from './EmailLogsViewer';
import { ScheduledJobsSettings } from './ScheduledJobsSettings';
import { SystemMetricsCard } from './SystemMetricsCard';

export function SettingsContent() {
  const { profile } = useAuth();
  const { isAdmin, isHR, role } = usePermissions();
  const { settings, isLoading, isUpdating, getSetting, updateSetting } = useSystemSettings();
  const { toast } = useToast();
  const [fiscalYearStart, setFiscalYearStart] = useState<Date>(new Date('2024-04-01'));

  // Define tabs based on role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    if (isHR || isAdmin) {
      baseTabs.push(
        { id: 'leave', label: 'Leave Management', icon: Calendar },
        { id: 'email-logs', label: 'Email Logs', icon: Mail },
        { id: 'scheduled-jobs', label: 'Scheduled Jobs', icon: Clock },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'metadata', label: 'Metadata', icon: Database },
      );
    }

    if (isAdmin) {
      baseTabs.push({ id: 'metrics', label: 'Metrics', icon: BarChart3 });
    }

    baseTabs.push({ id: 'demo', label: 'Demo', icon: Palette });

    return baseTabs;
  };

  const tabs = getAvailableTabs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSettingValue = (key: string) => {
    const setting = getSetting(key);
    return setting?.setting_value?.value || setting?.setting_value || '';
  };

  const handleUpdateSetting = async (key: string, value: string | number | boolean) => {
    try {
      await updateSetting(key, { value }, `Setting for ${key}`);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleFiscalYearUpdate = async (date: Date) => {
    try {
      await handleUpdateSetting('fiscal_year_start_date', date.toISOString().split('T')[0]);
      setFiscalYearStart(date);
      toast({
        title: "Success",
        description: "Fiscal year updated successfully. Leave entitlements will be recalculated.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update fiscal year",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-card p-8 shadow-hero">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            System Settings
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Configure system-wide settings and organizational preferences
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {role?.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {tabs.length} {tabs.length === 1 ? 'Module' : 'Modules'} Available
            </Badge>
          </div>
        </div>
      </div>

      {/* Dynamic Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-12 w-max min-w-full bg-gradient-card rounded-2xl p-2 shadow-sm">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:bg-primary/20 whitespace-nowrap min-w-0 flex-shrink-0"
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="general" className="space-y-6">
          <EnhancedGeneralSettingsCard 
            getSetting={getSettingValue}
            updateSetting={handleUpdateSetting}
            isUpdating={isUpdating}
          />
          
        </TabsContent>

        {(isHR || isAdmin) && (
          <TabsContent value="leave" className="space-y-6">
            <FiscalYearSettings
              fiscalYearStart={fiscalYearStart}
              onFiscalYearUpdate={handleFiscalYearUpdate}
              isUpdating={isUpdating}
            />
            <LeaveSettingsCard 
              getSetting={getSettingValue}
              updateSetting={handleUpdateSetting}
              isUpdating={isUpdating}
            />
          </TabsContent>
        )}

                  <TabsContent value="security" className="space-y-6">
                    <SecuritySettingsCard />
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-6">
                    <EmailNotificationSettings />
                  </TabsContent>

        {(isHR || isAdmin) && (
          <>
                    <TabsContent value="email-logs" className="space-y-6">
                      <EmailLogsViewer />
                    </TabsContent>

                    <TabsContent value="scheduled-jobs" className="space-y-6">
                      <ScheduledJobsSettings />
                    </TabsContent>

                    <TabsContent value="announcements" className="space-y-6">
                      <AnnouncementSettings />
                    </TabsContent>

            <TabsContent value="metadata" className="space-y-6">
              <MetadataManagement isUpdating={isUpdating} />
            </TabsContent>
          </>
        )}

        {isAdmin && (
          <TabsContent value="metrics" className="space-y-6">
            <Card className="bg-gradient-card shadow-hero">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>System Metrics</span>
                </CardTitle>
                <CardDescription>
                  Monitor system usage and performance statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-sm text-muted-foreground">
                    Advanced metrics dashboard will be available in the next release.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="demo" className="space-y-6">
          <Card className="bg-gradient-card shadow-hero">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Design Demo</span>
              </CardTitle>
              <CardDescription>
                Preview the design system components and styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-primary text-primary-foreground">
                  <h3 className="font-semibold">Primary Gradient</h3>
                  <p className="text-sm opacity-90">Main brand colors</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-accent text-accent-foreground">
                  <h3 className="font-semibold">Accent Gradient</h3>
                  <p className="text-sm opacity-90">Secondary highlights</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-hero bg-clip-text">
                  <h3 className="font-semibold text-transparent">Hero Gradient</h3>
                  <p className="text-sm text-muted-foreground">Text gradients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}