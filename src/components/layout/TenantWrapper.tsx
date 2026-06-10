import { ReactNode, useEffect } from 'react';
import { useSubdomainTenant, type Tenant } from '../../hooks/useSubdomainTenant';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Auth from '../../pages/Auth';
import { useAuth } from '../../contexts/AuthContext';

interface TenantWrapperProps {
  children: ReactNode;
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-3 border-gray-200 border-t-indigo-600 mx-auto mb-4 sm:mb-6"></div>
      <p className="text-sm sm:text-base text-gray-600 font-medium">Loading tenant information...</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-2">Please wait while we set up your workspace</p>
    </div>
  </div>
);

const AdminRedirectHandler = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const host = window.location.hostname;
      const parts = host.split('.');
      const subdomain = parts[0];
      
      // Check if this is admin domain and current path is root
      if ((subdomain === 'rjdh' || subdomain === 'www' || subdomain === 'localhost') && 
          window.location.pathname === '/') {
        // Only redirect to /auth if user is not authenticated
        if (!user) {
          navigate('/auth');
          return;
        }
      }
    }
  }, [navigate, user, loading]);
  
  return <>{children}</>;
};

export const TenantWrapper = ({ children }: TenantWrapperProps) => {
  const { tenant, loading, isAdminDomain } = useSubdomainTenant();

  if (loading) {
    return <LoadingScreen />;
  }

  // If it's admin domain, render normal app with redirect logic
  if (isAdminDomain) {
    return (
      <AdminRedirectHandler>
        {children}
      </AdminRedirectHandler>
    );
  }

  // If tenant exists, render full app with tenant context
  if (tenant) {
    return <>{children}</>;
  }

  // This shouldn't happen as hook redirects to /auth, but as fallback
  return (
    <Routes>
      <Route path="*" element={<Auth />} />
    </Routes>
  );
};