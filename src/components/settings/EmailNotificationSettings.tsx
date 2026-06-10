import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Bell, Users, Settings, AlertTriangle } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useSettings';
import { usePermissions } from '@/hooks/usePermissions';

export const EmailNotificationSettings = () => {
  const { settings, isLoading, isUpdating, updateSettings } = useNotificationSettings();
  const { isAdmin } = usePermissions();
  const [localSettings, setLocalSettings] = useState(settings);
  const [newCcEmail, setNewCcEmail] = useState('');

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
  };

  const addCcEmail = () => {
    if (newCcEmail && !localSettings.cc_emails?.includes(newCcEmail)) {
      setLocalSettings({
        ...localSettings,
        cc_emails: [...(localSettings.cc_emails || []), newCcEmail]
      });
      setNewCcEmail('');
    }
  };

  const removeCcEmail = (email: string) => {
    setLocalSettings({
      ...localSettings,
      cc_emails: localSettings.cc_emails?.filter(e => e !== email) || []
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/50 rounded animate-pulse" />
        <div className="h-32 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Global Email Settings
              </CardTitle>
              <CardDescription>Configure system-wide email notification settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Master switch for all email notifications</p>
            </div>
            <Switch
              checked={localSettings.email_notifications_enabled || false}
              onCheckedChange={(checked) => setLocalSettings({
                ...localSettings,
                email_notifications_enabled: checked
              })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email Address</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="admin@company.com"
                value={localSettings.admin_email || ''}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  admin_email: e.target.value
                })}
                className="bg-background/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Primary contact for system notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CC Email Management */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                CC Email Management
              </CardTitle>
              <CardDescription>Additional recipients for all system notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Add CC email address..."
              value={newCcEmail}
              onChange={(e) => setNewCcEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCcEmail()}
              className="bg-background/50 border-border/50"
            />
            <Button onClick={addCcEmail} variant="outline">
              Add
            </Button>
          </div>

          {localSettings.cc_emails && localSettings.cc_emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localSettings.cc_emails.map((email, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {email}
                  <button
                    onClick={() => removeCcEmail(email)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Notification Types
              </CardTitle>
              <CardDescription>Control which events trigger email notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Document Expiry Notifications</Label>
                <p className="text-sm text-muted-foreground">Alert when documents are expiring</p>
              </div>
              <Switch
                checked={localSettings.document_expiry_enabled || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  document_expiry_enabled: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Leave Status Updates</Label>
                <p className="text-sm text-muted-foreground">Notify on leave request changes</p>
              </div>
              <Switch
                checked={localSettings.leave_status_enabled || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  leave_status_enabled: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payslip Notifications</Label>
                <p className="text-sm text-muted-foreground">Alert when payslips are ready</p>
              </div>
              <Switch
                checked={localSettings.payslip_notifications_enabled || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  payslip_notifications_enabled: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Schedule */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Settings className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Reminder Schedule
              </CardTitle>
              <CardDescription>Configure when to send reminder notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="expiry_days">Document Expiry Reminder (days before)</Label>
              <Input
                id="expiry_days"
                type="number"
                min="1"
                max="365"
                value={localSettings.document_expiry_days || 30}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  document_expiry_days: parseInt(e.target.value)
                })}
                className="bg-background/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Send reminders this many days before documents expire</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Mode - Admin Only */}
      {isAdmin && (
        <Card className="bg-gradient-card shadow-hero border-border/50 border-warning/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                  Development Mode
                </CardTitle>
                <CardDescription className="text-warning">Admin only - Override email delivery for testing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="override_email">Override Email Address</Label>
              <Input
                id="override_email"
                type="email"
                placeholder="test@example.com"
                value={localSettings.override_email || ''}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  override_email: e.target.value
                })}
                className="bg-background/50 border-border/50"
              />
              <p className="text-xs text-warning">When set, all emails will be sent to this address instead of the intended recipients</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="bg-gradient-primary hover:shadow-lg transition-all duration-200"
        >
          {isUpdating ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
};