import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Globe, Palette, Building, Eye, Calendar } from 'lucide-react';
import { useBrandingSettings } from '@/hooks/useSettings';

interface GeneralSettingsCardProps {
  getSetting: (key: string) => string;
  updateSetting: (key: string, value: string) => void;
  isUpdating: boolean;
}

export const EnhancedGeneralSettingsCard: React.FC<GeneralSettingsCardProps> = ({
  getSetting,
  updateSetting,
  isUpdating,
}) => {
  const { settings, updateSettings } = useBrandingSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
  };

  const timezones = [
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
  ];

  const currencies = [
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
  ];

  const languages = [
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'it-IT', label: 'Italian' },
  ];

  return (
    <div className="space-y-6">
      {/* System Identity */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                System Identity
              </CardTitle>
              <CardDescription>Configure your application's core identity and branding</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={localSettings.application_name}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  application_name: e.target.value
                })}
                placeholder="HR Management System"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={localSettings.company_name || ''}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  company_name: e.target.value
                })}
                placeholder="Your Company Ltd."
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Globe className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Regional Settings
              </CardTitle>
              <CardDescription>Configure timezone, currency, and language preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select 
                value={localSettings.timezone} 
                onValueChange={(value) => setLocalSettings({
                  ...localSettings,
                  timezone: value
                })}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select 
                value={localSettings.currency} 
                onValueChange={(value) => setLocalSettings({
                  ...localSettings,
                  currency: value
                })}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={localSettings.language} 
                onValueChange={(value) => setLocalSettings({
                  ...localSettings,
                  language: value
                })}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Branding */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Palette className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Visual Branding
              </CardTitle>
              <CardDescription>Customize logos, colors, and visual elements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={localSettings.logo_url || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    logo_url: e.target.value
                  })}
                  placeholder="https://example.com/logo.png"
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input
                  id="favicon_url"
                  value={localSettings.favicon_url || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    favicon_url: e.target.value
                  })}
                  placeholder="https://example.com/favicon.ico"
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={localSettings.primary_color}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      primary_color: e.target.value
                    })}
                    className="w-16 h-10 p-1 bg-background/50 border-border/50"
                  />
                  <Input
                    value={localSettings.primary_color}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      primary_color: e.target.value
                    })}
                    placeholder="#3b82f6"
                    className="flex-1 bg-background/50 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={localSettings.secondary_color}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      secondary_color: e.target.value
                    })}
                    className="w-16 h-10 p-1 bg-background/50 border-border/50"
                  />
                  <Input
                    value={localSettings.secondary_color}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      secondary_color: e.target.value
                    })}
                    placeholder="#10b981"
                    className="flex-1 bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Eye className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Live Preview
              </CardTitle>
              <CardDescription>See how your branding will appear in the application</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-background/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={localSettings.logo_url} alt="Logo" />
                <AvatarFallback style={{ backgroundColor: localSettings.primary_color }}>
                  {localSettings.application_name?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: localSettings.primary_color }}>
                  {localSettings.application_name}
                </h3>
                {localSettings.company_name && (
                  <p className="text-sm text-muted-foreground">{localSettings.company_name}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Timezone:</span> {localSettings.timezone}
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span> {localSettings.currency}
              </div>
              <div>
                <span className="text-muted-foreground">Language:</span> {localSettings.language}
              </div>
              <div>
                <span className="text-muted-foreground">Fiscal Year:</span> {localSettings.fiscal_year_start}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Year Settings */}
      <Card className="bg-gradient-card shadow-hero border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg bg-gradient-hero bg-clip-text text-transparent">
                Fiscal Year Settings
              </CardTitle>
              <CardDescription>Configure your organization's fiscal year start date</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fiscal_year_start">Fiscal Year Start Date</Label>
            <Input
              id="fiscal_year_start"
              type="date"
              value={localSettings.fiscal_year_start}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                fiscal_year_start: e.target.value
              })}
              className="bg-background/50 border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              This affects leave allocations, financial reporting, and budget cycles
            </p>
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
          {isUpdating ? 'Saving...' : 'Save General Settings'}
        </Button>
      </div>
    </div>
  );
};