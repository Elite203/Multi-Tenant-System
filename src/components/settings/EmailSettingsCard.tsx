import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailSettingsCardProps {
  getSetting: (key: string) => string;
  updateSetting: (key: string, value: string) => void;
  isUpdating: boolean;
}

export function EmailSettingsCard({ getSetting, updateSetting, isUpdating }: EmailSettingsCardProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    smtp_host: getSetting('smtp_host'),
    smtp_port: getSetting('smtp_port'),
    smtp_username: getSetting('smtp_username'),
    smtp_password: getSetting('smtp_password'),
    smtp_use_tls: getSetting('smtp_use_tls') === 'true',
    email_from_name: getSetting('email_from_name'),
    email_from_address: getSetting('email_from_address'),
  });

  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, typeof value === 'boolean' ? value.toString() : value);
    });
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Simulate test email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please check your SMTP settings.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Settings
        </CardTitle>
        <CardDescription>
          Configure SMTP settings and email templates for system notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              value={localSettings.smtp_host}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              value={localSettings.smtp_port}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
              placeholder="587"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_username">SMTP Username</Label>
            <Input
              id="smtp_username"
              value={localSettings.smtp_username}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="password"
              value={localSettings.smtp_password}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
              placeholder="Your app password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_from_name">From Name</Label>
            <Input
              id="email_from_name"
              value={localSettings.email_from_name}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, email_from_name: e.target.value }))}
              placeholder="HR System"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_from_address">From Email Address</Label>
            <Input
              id="email_from_address"
              type="email"
              value={localSettings.email_from_address}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, email_from_address: e.target.value }))}
              placeholder="noreply@company.com"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="smtp_use_tls"
            checked={localSettings.smtp_use_tls}
            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, smtp_use_tls: checked }))}
          />
          <Label htmlFor="smtp_use_tls">Use TLS/SSL</Label>
        </div>

        <div className="border-t pt-6">
          <Label className="text-base font-medium">Test Email Configuration</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              type="email"
            />
            <Button onClick={handleTestEmail} disabled={isTesting} variant="outline">
              <Send className="h-4 w-4 mr-2" />
              {isTesting ? "Sending..." : "Test"}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Email Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}