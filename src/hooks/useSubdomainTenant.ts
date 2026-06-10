import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSubdomain, getTenantInfo } from '../lib/tenantDatabase.js';

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  status?: string;
  db_connection_url?: string;
  db_service_key?: string;
  [key: string]: any; // Allow additional properties
}

export const useSubdomainTenant = () => {
  const navigate = useNavigate();
  const [subdomain, setSubdomain] = useState<string>('');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminDomain, setIsAdminDomain] = useState(false);

  useEffect(() => {
    const detectTenantFromSubdomain = async () => {
      try {
        const sub = getCurrentSubdomain();
        setSubdomain(sub || '');
        
        // Check if it's admin domain
        const hostname = window.location.hostname;
        const adminDomains = ['rjdh', 'www', 'localhost'];
        const isAdmin = adminDomains.includes(hostname.split('.')[0]) || hostname === 'localhost' || hostname === '127.0.0.1';
        
        setIsAdminDomain(isAdmin);
        
        if (isAdmin) {
          setLoading(false);
          return;
        }

        if (!sub) {
          setLoading(false);
          return;
        }

        // Fetch tenant from database using existing function
        const tenantData = await getTenantInfo(sub);

        if (!tenantData) {
          // No tenant found, redirect to auth
          navigate('/auth');
          return;
        }
        
        setTenant(tenantData);
      } catch (error) {
        console.error('Error in tenant detection:', error);
        // On error, redirect to auth for non-admin domains
        if (!isAdminDomain) {
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    detectTenantFromSubdomain();
  }, [navigate, isAdminDomain]);

  return {
    subdomain,
    tenant,
    loading,
    isAdminDomain,
  };
};