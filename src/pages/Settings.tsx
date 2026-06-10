import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { SettingsContent } from '@/components/settings/SettingsContent';

export default function Settings() {
  const { isAdmin, isHR } = usePermissions();

  // Access control - allow admin, HR, and employees to access certain settings
  if (!isAdmin && !isHR) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You need administrator or HR permissions to access settings.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SettingsContent />
    </Layout>
  );
}