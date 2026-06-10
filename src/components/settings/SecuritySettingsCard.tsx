import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock, Timer, AlertTriangle } from 'lucide-react';
import { useSecuritySettings } from '@/hooks/useSettings';

export const SecuritySettingsCard = () => {
  const { settings, isLoading, isUpdating, updateSettings } = useSecuritySettings();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
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
      {/* Password Policy */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Password Policy
              </CardTitle>
              <CardDescription>Configure password requirements for all users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min_password_length">Minimum Password Length</Label>
              <Input
                id="min_password_length"
                type="number"
                min="6"
                max="20"
                value={localSettings.min_password_length || 8}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  min_password_length: parseInt(e.target.value)
                })}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Uppercase Letters</Label>
                <p className="text-sm text-muted-foreground">At least one A-Z character</p>
              </div>
              <Switch
                checked={localSettings.require_uppercase || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  require_uppercase: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Lowercase Letters</Label>
                <p className="text-sm text-muted-foreground">At least one a-z character</p>
              </div>
              <Switch
                checked={localSettings.require_lowercase || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  require_lowercase: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Numbers</Label>
                <p className="text-sm text-muted-foreground">At least one 0-9 character</p>
              </div>
              <Switch
                checked={localSettings.require_numbers || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  require_numbers: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">At least one !@#$% character</p>
              </div>
              <Switch
                checked={localSettings.require_special_chars || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  require_special_chars: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Timer className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Session Management
              </CardTitle>
              <CardDescription>Control user session and authentication settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                min="5"
                max="1440"
                value={localSettings.session_timeout_minutes || 480}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  session_timeout_minutes: parseInt(e.target.value)
                })}
                className="bg-background/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Users will be logged out after this period of inactivity</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
              </div>
              <Switch
                checked={localSettings.two_factor_enabled || false}
                onCheckedChange={(checked) => setLocalSettings({
                  ...localSettings,
                  two_factor_enabled: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Account Security
              </CardTitle>
              <CardDescription>Brute force protection and account lockout settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_attempts">Maximum Login Attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                min="3"
                max="10"
                value={localSettings.max_login_attempts || 5}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  max_login_attempts: parseInt(e.target.value)
                })}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout_duration"
                type="number"
                min="5"
                max="1440"
                value={localSettings.lockout_duration_minutes || 30}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  lockout_duration_minutes: parseInt(e.target.value)
                })}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="bg-gradient-primary hover:shadow-lg transition-all duration-200"
        >
          {isUpdating ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </div>
    </div>
  );
};