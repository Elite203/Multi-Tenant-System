import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface GeneralSettingsCardProps {
  getSetting: (key: string) => string;
  updateSetting: (key: string, value: string) => void;
  isUpdating: boolean;
}

export function GeneralSettingsCard({ getSetting, updateSetting, isUpdating }: GeneralSettingsCardProps) {
  const [localSettings, setLocalSettings] = useState({
    app_name: getSetting('app_name'),
    app_logo_url: getSetting('app_logo_url'),
    company_contact_email: getSetting('company_contact_email'),
    company_contact_phone: getSetting('company_contact_phone'),
    company_address: getSetting('company_address'),
    support_email: getSetting('support_email'),
    default_timezone: getSetting('default_timezone'),
  });

  const timezones = [
    'UTC',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Australia/Sydney',
    'Asia/Tokyo',
    'Europe/Paris',
    'America/Toronto'
  ];

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <Card className="bg-gradient-card shadow-hero">
      <CardHeader>
        <CardTitle className="bg-gradient-hero bg-clip-text text-transparent">
          General Settings
        </CardTitle>
        <CardDescription>
          Configure application branding and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="app_name">Application Name</Label>
            <Input
              id="app_name"
              value={localSettings.app_name}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, app_name: e.target.value }))}
              placeholder="HR Management System"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app_logo_url">Logo URL</Label>
            <Input
              id="app_logo_url"
              value={localSettings.app_logo_url}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, app_logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_contact_email">Company Email</Label>
            <Input
              id="company_contact_email"
              type="email"
              value={localSettings.company_contact_email}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, company_contact_email: e.target.value }))}
              placeholder="admin@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_contact_phone">Company Phone</Label>
            <Input
              id="company_contact_phone"
              value={localSettings.company_contact_phone}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, company_contact_phone: e.target.value }))}
              placeholder="+44 20 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              value={localSettings.support_email}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, support_email: e.target.value }))}
              placeholder="support@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_timezone">Default Timezone</Label>
            <Select 
              value={localSettings.default_timezone} 
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, default_timezone: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_address">Company Address</Label>
          <Textarea
            id="company_address"
            value={localSettings.company_address}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, company_address: e.target.value }))}
            placeholder="123 Business Street, City, Country"
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save General Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}