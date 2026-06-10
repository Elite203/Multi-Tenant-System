import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ useNavigate instead of next/router
import { supabase } from "../../lib/supabaseClient";
import { GlobalSyncStatus } from "./GlobalSyncStatus";
import { syncService } from "../../services/syncService";
import { toast } from "../../hooks/use-toast";

export default function AdminPage({ adminUser }) {
  const navigate = useNavigate(); // ✅ useNavigate hook
  const [tenants, setTenants] = useState([]);
  const [newSubdomain, setNewSubdomain] = useState("");
  const [newName, setNewName] = useState("");
  const [newDbName, setNewDbName] = useState("");
  const [newDbPass, setNewDbPass] = useState("");
  const [newGithubSubBranch, setNewGithubSubBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTenants, setFetchingTenants] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [projectData, setProjectData] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [visibleProjectIds, setVisibleProjectIds] = useState({});
  const [syncingId, setSyncingId] = useState(null);

  const githubBranchPayload = {
    owner: process.env.REACT_APP_GITHUB_OWNER || "jnanih",
    repo: process.env.REACT_APP_GITHUB_REPO || "spirit-staff",
    baseBranch: process.env.REACT_APP_GITHUB_BASE_BRANCH || "main",
    newBranch: newGithubSubBranch,
  };

  const fetchTenants = async () => {
    setFetchingTenants(true);
    try {
      console.log("🔄 Fetching tenants from database...");
      console.log("🌐 Supabase URL:", supabase.supabaseUrl);
      console.log("🔑 Supabase Key exists:", !!supabase.supabaseKey);
      console.log("🔍 Environment variables:");
      console.log("  VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("  VITE_SUPABASE_KEY exists:", !!import.meta.env.VITE_SUPABASE_KEY);

      // Test connection first
      const { data: connectionTest, error: connectionError } = await supabase
        .from("tenants")
        .select("count", { count: 'exact', head: true });

      if (connectionError) {
        console.error("❌ Connection test failed:", connectionError);
      } else {
        console.log("✅ Connection successful, tenant count:", connectionTest);
      }

      // Try multiple query approaches
      let { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order('created_at', { ascending: false });

      // If ordering fails, try without ordering  
      if (error && error.message.includes('created_at')) {
        console.warn("⚠️ Retrying without created_at ordering...");
        const fallbackResult = await supabase
          .from("tenants")
          .select("*");
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error("❌ Error fetching tenants:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error hint:", error.hint);
        console.error("❌ Error details:", error.details);
        setTenants([]); // Set empty array on error
      } else {
        console.log("✅ Tenants fetched successfully:", data);
        console.log("✅ Number of tenants found:", data?.length || 0);
        if (data && data.length > 0) {
          console.log("✅ First tenant data:", data[0]);
        }
        setTenants(data || []);
      }
    } catch (err) {
      console.error("💥 Unexpected error fetching tenants:", err);
      console.error("💥 Error name:", err.name);
      console.error("💥 Error message:", err.message);
      console.error("💥 Error stack:", err.stack);
      setTenants([]);
    } finally {
      setFetchingTenants(false);
    }
  };

  // Fetch tenants on component mount
  useEffect(() => {
    console.log("🚀 AdminPage component mounted - fetching tenants");
    fetchTenants();
  }, []);

  // Mobile responsive hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force re-render state for sync status updates
  const [, forceUpdate] = useState({});

  // Listen to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(() => {
      // Force re-render when sync status changes
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  // Add tenant via API (provisions project)
  const handleAddTenant = async (e) => {
    e.preventDefault();
    if (!newSubdomain || !newName || !newDbName || !newDbPass || !newGithubSubBranch)
      return alert("All fields required");
    if (/[A-Z]/.test(newSubdomain) || /[A-Z]/.test(newName))
      return alert("No capital letters allowed!");

    // Debug logging - capture form values
    console.log("🔍 Form field values captured:");
    console.log("  subdomain:", newSubdomain);
    console.log("  name:", newName);
    console.log("  db_name:", newDbName);
    console.log("  db_pass:", newDbPass);
    console.log("  github_sub_branch:", newGithubSubBranch);

    setLoading(true);
    try {
      // Step 1: Create Supabase project via backend API
      console.log("🚀 Step 1: Creating Supabase project...");

      const githubBranchResponse = await fetch("/api/creategithubBranch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(githubBranchPayload),
      });

      const githubBranchData = await githubBranchResponse.json().catch(() => ({}));

      if (!githubBranchResponse.ok) {
        console.error("❌ GitHub branch creation failed:", githubBranchData);
        alert(
          `Error creating GitHub branch:\n${githubBranchData.error || "Unknown"}\n\nDetails: ${githubBranchData.details || "No details"
          }`
        );
        return;
      }

      console.log("✅ GitHub branch created:", githubBranchData);

      const supabasePayload = {
        name: newName,
        organization_id: "cdqxaoesmxtvnrrjudmq",
        region: "eu-west-2",
        db_pass: newDbPass,
        plan: "free",
      };

      console.log("📦 Supabase API payload:", JSON.stringify(supabasePayload, null, 2));

      const projectResponse = await fetch("/api/createProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supabasePayload),
      });

      const projectResponseData = await projectResponse.json().catch(() => ({}));
      console.log("📡 Backend API response:", projectResponse.status, projectResponseData);

      if (!projectResponse.ok) {
        console.error("❌ Project creation failed:", projectResponseData);
        alert(
          `Error creating Supabase project:\n${projectResponseData.error || "Unknown"}\n\nDetails: ${projectResponseData.details || "No details"
          }`
        );
        return;
      }

      console.log("✅ Step 1 Complete - Supabase project created:", projectResponseData.project);

      // Extract project ID from the response
      const projectId = projectResponseData.project?.id || projectResponseData.id || null;
      console.log("🔑 Extracted Project ID:", projectId);

      if (!projectId) {
        console.error("❌ No project ID found in response");
        alert("Error: Could not retrieve project ID from Supabase API response");
        return;
      }

      // Step 2: Save tenant record immediately (without secret key)
      console.log("🚀 Step 2: Saving tenant to master database...");

      const tenantPayload = {
        subdomain: newSubdomain,
        name: newName,
        db_name: newDbName,
        db_pass: newDbPass,
        tenantid: projectId
      };

      console.log("📦 Save Tenant API payload:", JSON.stringify(tenantPayload, null, 2));

      const tenantResponse = await fetch("/api/saveTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantPayload),
      });

      const tenantData = await tenantResponse.json().catch(() => ({}));

      if (!tenantResponse.ok) {
        console.error("❌ Tenant save error:", tenantData);
        alert(
          `Error saving tenant:\n${tenantData.error || "Unknown"}\n\nDetails: ${tenantData.details || "No details"
          }`
        );
        return;
      }

      console.log("✅ Step 2 Complete - Tenant saved to master database:", tenantData);

      // Store project data for use after secret key is provided
      setProjectData({
        projectId,
        subdomain: newSubdomain,
        name: newName,
        db_name: newDbName,
        db_pass: newDbPass,
        tenantRecordId: tenantData.tenant?.id
      });

      // Step 3: Show secret key modal
      setShowSecretKeyModal(true);

    } catch (err) {
      console.error("💥 Network error:", err.message);
      alert(`Network error:\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Complete tenant creation with secret key
  const handleCompleteTenantCreation = async () => {
    if (!secretKey.trim()) {
      alert("Secret key is required");
      return;
    }

    if (!projectData) {
      alert("Project data not found. Please try creating the tenant again.");
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 Step 3: Updating tenant with secret key...");

      const updatePayload = {
        subdomain: projectData.subdomain,
        secretKey: secretKey.trim()
      };

      console.log("📦 Update Tenant Secret Key API payload:", JSON.stringify({ ...updatePayload, secretKey: "[HIDDEN]" }, null, 2));

      const updateResponse = await fetch("/api/updateTenantSecretKey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const updateData = await updateResponse.json().catch(() => ({}));

      if (!updateResponse.ok) {
        console.error("❌ Tenant secret key update error:", updateData);
        alert(
          `Error updating tenant secret key:\n${updateData.error || "Unknown"}\n\nDetails: ${updateData.details || "No details"
          }`
        );
        return;
      }

      console.log("✅ Tenant secret key updated successfully:", updateData);

      alert("🎉 Tenant created successfully!");
      setNewSubdomain("");
      setNewName("");
      setNewDbName("");
      setNewDbPass("");
      setNewGithubSubBranch("");
      setSecretKey("");
      setProjectData(null);
      setShowSecretKeyModal(false);
      fetchTenants(); // refresh tenant list

    } catch (err) {
      console.error("💥 Network error:", err.message);
      alert(`Network error:\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete tenant
  const handleDeleteTenant = async (id, name) => {
    if (!window.confirm(`Delete tenant "${name}"?`)) return;

    // Set loading state for better UX
    const tenantToDelete = tenants.find(t => t.id === id);
    if (!tenantToDelete) return alert("Tenant not found");

    setDeletingId(id);

    try {
      console.log(`🗑️ Starting deletion process for tenant: ${name}`);

      // Delete Supabase project and tenant record via backend API
      console.log("🚀 Deleting Supabase project and tenant record...");
      const deleteResponse = await fetch("/api/deleteProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: id,
          name: tenantToDelete.name,
          db_name: tenantToDelete.db_name || tenantToDelete.dbname,
          tenantid: tenantToDelete.tenantid,
        }),
      });

      const responseData = await deleteResponse.json().catch(() => ({}));
      console.log("📡 Delete API response:", deleteResponse.status, responseData);

      if (!deleteResponse.ok) {
        console.error("❌ Deletion failed:", responseData);
        alert(
          `Error deleting tenant:\n${responseData.error || "Unknown error"}\n\nDetails: ${responseData.details || "No details available"
          }`
        );
        setDeletingId(null);
        return;
      }

      console.log("✅ Tenant and Supabase project deleted successfully!");

      alert(`🎉 Tenant "${name}" deleted successfully!`);
      fetchTenants(); // refresh tenant list

    } catch (err) {
      console.error("💥 Network error during deletion:", err.message);
      alert(`Network error during deletion:\n${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Delete Sub Branch
  const handleDeleteGithubBranch = async (tenantName) => {
    if (!tenantName) {
      alert("❌ Missing tenant name for GitHub branch deletion");
      return;
    }

    try {
      console.log(`🧩 Deleting GitHub branch for tenant: ${tenantName}`);

      const response = await fetch("/api/githubDeleteSubBranch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: githubBranchPayload.owner,
          repo: githubBranchPayload.repo,
          branchName: tenantName, // tenant name is the branch name
        }),
      });

      const data = await response.json();
      console.log("📡 GitHub Delete Branch API response:", response.status, data);

      if (response.ok) {
        console.log(`✅ GitHub branch '${tenantName}' deleted successfully.`);
      } else if (response.status === 404) {
        console.warn(`⚠️ GitHub branch '${tenantName}' not found.`);
      } else {
        console.error("❌ GitHub branch deletion failed:", data);
        alert(`Failed to delete GitHub branch: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("💥 Error deleting GitHub branch:", err.message);
      alert(`GitHub branch deletion error:\n${err.message}`);
    }
  };



  // Toggle project ID visibility
  const toggleProjectIdVisibility = (tenantId) => {
    setVisibleProjectIds(prev => ({
      ...prev,
      [tenantId]: !prev[tenantId]
    }));
  };

  // Check if 5 minutes have passed since tenant creation
  const isSyncEnabled = (createdAt) => {
    if (!createdAt) return false;
    const now = new Date();
    const created = new Date(createdAt);
    const fiveMinutesInMs = 5 * 60 * 1000;
    return (now - created) >= fiveMinutesInMs;
  };



  // Sync schema for tenant
  const handleSyncSchema = async (tenant) => {
    const dbPassword = tenant.db_pass || tenant.dbpass || tenant.db_password;

    if (!tenant.tenantid || !dbPassword) {
      toast({
        title: "❌ Sync Error",
        description: "Missing project ID or database password for sync",
        variant: "destructive",
      });
      return;
    }

    setSyncingId(tenant.id);

    try {
      const tenantDbUrl = `postgresql://postgres.${tenant.tenantid}:${dbPassword}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`;

      const response = await fetch("/api/applySchema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantDbUrl: tenantDbUrl
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("❌ Schema sync failed:", responseData);
        toast({
          title: "❌ Sync Error",
          description: `Error syncing schema: ${responseData.error || "Unknown error"}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Schema sync successful:", responseData);
      toast({
        title: "✅ Sync Complete",
        description: `Schema synced successfully for ${tenant.name}`,
        variant: "default",
      });
      fetchTenants();

    } catch (err) {
      console.error("💥 Network error during sync:", err.message);
      toast({
        title: "❌ Network Error",
        description: `Network error: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  };



  // Logout function (admin only, no global auth logout)
  const handleLogout = async () => {
    try {
      console.log("🚪 Logging out from admin panel...");
      // Don't sign out from Supabase auth - just redirect to admin login
      console.log("✅ Admin logout successful - redirecting to /admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("💥 Admin logout error:", err);
      alert("Error logging out from admin: " + err.message);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
  };

  const cardStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: isMobile ? '1.5rem 1rem' : '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  };

  const titleStyle = {
    fontSize: isMobile ? '1.25rem' : '2rem',
    fontWeight: '700',
    margin: '0',
    textAlign: isMobile ? 'center' : 'left',
    flex: isMobile ? '1 1 100%' : '1',
  };

  const logoutButtonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '0.5rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const contentStyle = {
    padding: isMobile ? '1rem' : '2rem',
  };

  const sectionStyle = {
    marginBottom: isMobile ? '1.5rem' : '2rem',
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? '1.125rem' : '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e5e7eb',
  };

  const formStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: isMobile ? 'stretch' : 'end',
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: isMobile ? 'auto' : '200px',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.25rem',
  };

  const inputStyle = {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: 'fit-content',
    width: isMobile ? '100%' : 'auto',
  };

  const deleteButtonStyle = {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const syncButtonStyle = {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginRight: '0.5rem',
  };

  const syncButtonDisabledStyle = {
    ...syncButtonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  };

  const tableContainerStyle = {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    WebkitOverflowScrolling: 'touch',
    maxHeight: tenants.length > 5 ? (isMobile ? '400px' : '480px') : 'none',
    overflowY: tenants.length > 5 ? 'auto' : 'visible',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    minWidth: isMobile ? '900px' : '1000px',
  };

  const thStyle = {
    backgroundColor: '#f9fafb',
    padding: isMobile ? '0.5rem' : '0.75rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: isMobile ? '0.5rem' : '0.75rem',
    borderBottom: '1px solid #e5e7eb',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Tenant Management</h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => navigate("/admin/dashboard")} // ✅ changed
              style={logoutButtonStyle}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
              }
            >
              Schema Explorer
            </button>

            <button
              onClick={handleLogout}
              style={logoutButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={contentStyle}>
          {/* Add Tenant Form */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Add New Tenant</h2>
            <form onSubmit={handleAddTenant} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Subdomain *</label>
                <input
                  type="text"
                  placeholder="client1"
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Project Name *</label>
                <input
                  type="text"
                  placeholder="client-one"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>DB Name *</label>
                <input
                  type="text"
                  placeholder="client_one_db"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>DB Password *</label>
                <input
                  type="password"
                  placeholder="securepassword123"
                  value={newDbPass}
                  onChange={(e) => setNewDbPass(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>GitHub Sub Branch Name *</label>
                <input
                  type="text"
                  placeholder="feature/client-branch"
                  value={newGithubSubBranch}
                  onChange={(e) => setNewGithubSubBranch(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <button
                type="submit"
                style={buttonStyle}
                disabled={loading}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
              >
                {loading ? "Creating..." : "Add Tenant"}
              </button>
            </form>
          </div>

          {/* Tenant List */}
          <div style={sectionStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <h2 style={{ ...sectionTitleStyle, marginBottom: 0, borderBottom: 'none' }}>Active Tenants ({tenants.length})</h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <GlobalSyncStatus showButton={true} />
                <button
                  onClick={fetchTenants}
                  disabled={fetchingTenants}
                  style={{
                    backgroundColor: fetchingTenants ? '#93c5fd' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: fetchingTenants ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => !fetchingTenants && (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !fetchingTenants && (e.target.style.backgroundColor = '#10b981')}
                >
                  {fetchingTenants ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            {fetchingTenants ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                ⏳ Loading tenants...
              </div>
            ) : tenants.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
                  No tenants found. Add your first tenant above or click refresh to reload.
                </p>
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Subdomain</th>
                      <th style={thStyle}>Project Name</th>
                      <th style={thStyle}>DB Name</th>
                      <th style={thStyle}>Project ID</th>
                      <th style={thStyle}>Secret Key Added</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td style={tdStyle}>
                          <a
                            href={`https://${tenant.subdomain}.rjdh.app/auth`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {tenant.subdomain}
                          </a>
                        </td>
                        <td style={tdStyle}>{tenant.name}</td>
                        <td style={tdStyle} title={tenant.db_name || tenant.dbname}>
                          <code style={{ fontSize: '0.8em', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                            {(tenant.db_name || tenant.dbname || '').length > 15
                              ? `${(tenant.db_name || tenant.dbname || '').substring(0, 15)}...`
                              : (tenant.db_name || tenant.dbname || 'N/A')
                            }
                          </code>
                        </td>
                        <td style={tdStyle}>
                          {tenant.tenantid ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <code style={{ fontSize: '0.8em', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                                {visibleProjectIds[tenant.id]
                                  ? tenant.tenantid
                                  : `${tenant.tenantid.substring(0, 8)}...`
                                }
                              </code>
                              <button
                                onClick={() => toggleProjectIdVisibility(tenant.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  ':hover': { backgroundColor: '#f3f4f6' }
                                }}
                                title={visibleProjectIds[tenant.id] ? 'Hide full ID' : 'Show full ID'}
                              >
                                {visibleProjectIds[tenant.id] ? '👁️' : '👁️‍🗨️'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>Missing</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {tenant.tenantservicekey ? (
                            <span style={{
                              color: '#10b981',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              backgroundColor: '#dcfce7',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              ✓ Added
                            </span>
                          ) : (
                            <span style={{
                              color: '#ef4444',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              backgroundColor: '#fee2e2',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              ✗ Missing
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {tenant.created_at
                            ? new Date(tenant.created_at).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleSyncSchema(tenant)}
                              style={isSyncEnabled(tenant.created_at) ? syncButtonStyle : syncButtonDisabledStyle}
                              disabled={!isSyncEnabled(tenant.created_at) || syncingId === tenant.id}
                              title={!isSyncEnabled(tenant.created_at) ? 'Wait 5 minutes after creation' : 'Sync schema to tenant database'}
                              onMouseEnter={(e) => isSyncEnabled(tenant.created_at) && syncingId !== tenant.id && (e.target.style.backgroundColor = '#059669')}
                              onMouseLeave={(e) => isSyncEnabled(tenant.created_at) && syncingId !== tenant.id && (e.target.style.backgroundColor = '#10b981')}
                            >
                              {syncingId === tenant.id ? "Syncing..." : "Sync Schema"}
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteGithubBranch(tenant.name); // 🧩 Delete GitHub branch first
                                handleDeleteTenant(tenant.id, tenant.name); // 🗑️ Then delete tenant + Supabase project
                              }}
                              style={deleteButtonStyle}
                              disabled={deletingId === tenant.id}
                              onMouseEnter={(e) => deletingId !== tenant.id && (e.target.style.backgroundColor = '#dc2626')}
                              onMouseLeave={(e) => deletingId !== tenant.id && (e.target.style.backgroundColor = '#ef4444')}
                            >
                              {deletingId === tenant.id ? "Deleting..." : "Delete"}
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secret Key Modal */}
      {showSecretKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: isMobile ? '1rem' : '2rem',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: isMobile ? '100%' : '28rem',
            width: '100%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              🔑 Add Secret Key
            </h3>

            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Project created successfully! Please provide the tenant service key to complete the setup.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Secret Key *
              </label>
              <input
                type="password"
                placeholder="Enter the tenant service key..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                style={{
                  ...inputStyle,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowSecretKeyModal(false);
                  setSecretKey('');
                  setProjectData(null);
                }}
                disabled={loading}
                style={{
                  ...logoutButtonStyle,
                  backgroundColor: '#6b7280',
                  border: '1px solid #6b7280',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTenantCreation}
                disabled={loading || !secretKey.trim()}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading || !secretKey.trim() ? '#93c5fd' : '#3b82f6',
                  cursor: loading || !secretKey.trim() ? 'not-allowed' : 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                {loading ? "Creating..." : "Complete Setup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}