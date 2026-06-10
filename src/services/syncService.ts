import { toast } from "../hooks/use-toast";
import { supabase } from "../lib/supabaseClient";

class SyncService {
  private isSyncing = false;
  private currentSyncId: string | null = null;
  private listeners: Array<() => void> = [];

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public onStatusChange(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  public async syncAllTenants(): Promise<void> {
    if (this.isSyncing) {
      toast({
        title: "⚠️ Sync in Progress",
        description: "Another sync operation is already running",
        variant: "default",
      });
      return;
    }

    this.isSyncing = true;
    const syncId = this.generateSyncId();
    this.currentSyncId = syncId;
    this.notifyListeners();

    toast({
      title: "🔄 Starting Sync",
      description: "Syncing Master DB to all tenants...",
      variant: "default",
    });

    try {
      // Fetch tenants from Supabase
      let { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .order('created_at', { ascending: false });

      // If ordering fails, try without ordering  
      if (error && error.message.includes('created_at')) {
        console.warn("⚠️ Retrying without created_at ordering...");
        const fallbackResult = await supabase
          .from("tenants")
          .select("*");
        tenants = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        throw new Error(`Failed to fetch tenants: ${error.message}`);
      }

      if (!tenants) {
        tenants = [];
      }

      // Check if 5 minutes have passed since tenant creation
      const isSyncEnabled = (createdAt: string | null) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const fiveMinutesInMs = 5 * 60 * 1000;
        return (now - created) >= fiveMinutesInMs;
      };

      // Filter eligible tenants
      const eligibleTenants = tenants.filter((t: any) => 
        isSyncEnabled(t.created_at) && 
        t.tenantid && 
        (t.db_pass || t.dbpass || t.db_password)
      );

      if (eligibleTenants.length === 0) {
        toast({
          title: "⚠️ No Eligible Tenants",
          description: "No tenants are eligible for sync at this time",
          variant: "default",
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Process each tenant
      for (const tenant of eligibleTenants) {
        // Check if sync was cancelled
        if (this.currentSyncId !== syncId) {
          break;
        }

        try {
          const dbPassword = tenant.db_pass || tenant.dbpass || tenant.db_password;
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

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`❌ Schema sync failed for ${tenant.name}:`, responseData);
          }
        } catch (err) {
          failCount++;
          console.error(`💥 Network error syncing ${tenant.name}:`, err);
        }
      }

      // Show final result toast for 6 seconds
      if (this.currentSyncId === syncId) {
        if (failCount === 0) {
          toast({
            title: "✅ Sync Complete",
            description: `Master DB was synced successfully to all ${successCount} tenants`,
            variant: "default",
            duration: 6000,
          });
        } else if (successCount === 0) {
          toast({
            title: "❌ Sync Failed",
            description: `Failed to sync all ${failCount} tenants`,
            variant: "destructive",
            duration: 6000,
          });
        } else {
          toast({
            title: "⚠️ Partial Sync",
            description: `${successCount} synced successfully, ${failCount} failed`,
            variant: "default",
            duration: 6000,
          });
        }
      }

    } catch (err) {
      console.error("💥 Network error during bulk sync:", err);
      if (this.currentSyncId === syncId) {
        toast({
          title: "❌ Sync Error",
          description: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          variant: "destructive",
          duration: 6000,
        });
      }
    } finally {
      if (this.currentSyncId === syncId) {
        this.isSyncing = false;
        this.currentSyncId = null;
        this.notifyListeners();
      }
    }
  }

  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  public cancelSync(): void {
    this.currentSyncId = null;
  }
}

// Export singleton instance
export const syncService = new SyncService();