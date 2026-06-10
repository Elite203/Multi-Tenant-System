import { useState, useEffect } from "react";
import { 
  getCurrentSubdomain, 
  getCurrentClient, 
  storeDataForCurrentTenant, 
  fetchDataForCurrentTenant 
} from "../lib/tenantDatabase";

export default function TenantPage({ tenant }) {
  const [tenantData, setTenantData] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSubdomain, setCurrentSubdomain] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subdomain = getCurrentSubdomain();
      setCurrentSubdomain(subdomain);
    }
    
    if (tenant) {
      fetchTenantData();
    }
  }, [tenant]);

  // Auto-redirect to tenant subdomain auth when tenant is available
  useEffect(() => {
    if (typeof window !== 'undefined' && tenant?.subdomain) {
      const targetUrl = `https://${tenant.subdomain}.rjdh.app/auth`;
      const currentHost = window.location.host;
      const currentPath = window.location.pathname;
      const alreadyOnTarget = (currentHost === `${tenant.subdomain}.rjdh.app` && currentPath.startsWith('/auth'));
      if (!alreadyOnTarget) {
        window.location.replace(targetUrl);
      }
    }
  }, [tenant]);

  const fetchTenantData = async () => {
    try {
      const data = await fetchDataForCurrentTenant("tenant_data", {
        order: { column: "created_at", options: { ascending: false } }
      });
      setTenantData(data || []);
    } catch (err) {
      console.error("Error fetching tenant data:", err);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    setLoading(true);
    try {
      await storeDataForCurrentTenant("tenant_data", {
        data_type: "user_entry",
        content: { message: newEntry.trim(), timestamp: new Date().toISOString() }
      });
      
      setNewEntry("");
      await fetchTenantData();
      alert("Entry saved to your isolated database!");
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Error saving entry: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#ef4444' }}>Tenant not configured yet.</h1>
      <p style={{ color: '#6b7280', marginTop: '1rem' }}>
        This subdomain needs to be set up in the admin panel first.
      </p>
    </div>
  );

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 1rem',
    fontFamily: 'system-ui, sans-serif'
  };

  const cardStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  };

  const headerStyle = {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '2rem',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    margin: '0'
  };

  const contentStyle = {
    padding: '2rem'
  };

  const sectionStyle = {
    marginBottom: '2rem'
  };

  const formStyle = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    alignItems: 'end'
  };

  const inputStyle = {
    flex: '1',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'all 0.2s ease'
  };

  const entryStyle = {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    border: '1px solid #e5e7eb'
  };

  // Prevent rendering landing content while redirecting to /auth
  if (typeof window !== 'undefined' && tenant?.subdomain) {
    const targetHost = `${tenant.subdomain}.rjdh.app`;
    const alreadyOnAuth = (window.location.host === targetHost && window.location.pathname.startsWith('/auth'));
    if (!alreadyOnAuth) {
      return null;
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            Welcome {tenant.name} 🚀
          </h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
            {tenant.subdomain}.rjdh.app
          </p>
          {currentSubdomain && (
            <p style={{ 
              margin: '1rem 0 0', 
              fontSize: '0.875rem', 
              opacity: 0.8,
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '0.5rem',
              borderRadius: '6px'
            }}>
              🔒 Your data is isolated in your private database
            </p>
          )}
        </div>
        
        <div style={contentStyle}>
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Add Data to Your Private Database
            </h2>
            <form onSubmit={handleAddEntry} style={formStyle}>
              <input
                type="text"
                placeholder="Enter some data to store in your tenant database..."
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                style={inputStyle}
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading}
                style={buttonStyle}
              >
                {loading ? "Saving..." : "Add Entry"}
              </button>
            </form>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Your Stored Data ({tenantData.length} entries)
            </h2>
            {tenantData.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                No data stored yet. Add your first entry above!
              </div>
            ) : (
              <div>
                {tenantData.map((entry, index) => (
                  <div key={entry.id || index} style={entryStyle}>
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {entry.content?.message || 'No message'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Created: {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.5rem', color: '#1e40af' }}>
              🔐 Database Isolation Information
            </h3>
            <p style={{ fontSize: '0.875rem', margin: '0', color: '#374151' }}>
              <strong>Current Subdomain:</strong> {currentSubdomain || 'localhost (using master database)'}<br/>
              <strong>Database URL:</strong> {tenant.db_connection_url ? '✅ Configured' : '❌ Not configured'}<br/>
              <strong>Service Key:</strong> {tenant.db_service_key ? '✅ Configured' : '❌ Not configured'}
            </p>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0', color: '#6b7280' }}>
              All data entered above is stored exclusively in your isolated database and cannot be accessed by other tenants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}