import { createClient } from "@supabase/supabase-js";

// Use the same credentials as the existing supabaseClient with correct environment variable names
const MASTER_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://khxyusmbfpgoftrnbmyk.supabase.co";
const MASTER_SUPABASE_KEY = import.meta.env.MASTER_SUPABASE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeHl1c21iZnBnb2Z0cm5ibXlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk4Njg2NiwiZXhwIjoyMDcyNTYyODY2fQ.XinEnpd8pbUN4-mLqkbSQXRP1MSijjYAvQtIRsu6b-U";

// Cache for tenant database clients to avoid recreating them
const tenantClientsCache = new Map();

/**
 * Get the master Supabase client
 */
export function getMasterClient() {
  return createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);
}

/**
 * Extract subdomain from current hostname
 */
export function getCurrentSubdomain() {
  if (typeof window === 'undefined') return null; // Server-side rendering guard
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost development, return null (use master database)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Extract subdomain (first part before main domain)
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
}

/**
 * Get tenant information from master database by subdomain
 */
export async function getTenantInfo(subdomain) {
  if (!subdomain) return null;
  
  const masterClient = getMasterClient();
  
  try {
    const { data, error } = await masterClient
      .from("tenants")
      .select("*")
      .eq("subdomain", subdomain)
      .single();
    
    if (error) {
      console.error("Error fetching tenant info:", error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error("Unexpected error fetching tenant info:", err);
    return null;
  }
}

/**
 * Get or create a tenant-specific Supabase client
 */
export async function getTenantClient(subdomain) {
  if (!subdomain) {
    return getMasterClient();
  }
  
  // Check cache first
  if (tenantClientsCache.has(subdomain)) {
    return tenantClientsCache.get(subdomain);
  }
  
  // Fetch tenant info from master database
  const tenantInfo = await getTenantInfo(subdomain);
  
  if (!tenantInfo || !tenantInfo.db_connection_url || !tenantInfo.db_service_key) {
    console.warn(`No valid tenant database found for subdomain: ${subdomain}`);
    return getMasterClient();
  }
  
  // Create tenant-specific client
  const tenantClient = createClient(
    tenantInfo.db_connection_url,
    tenantInfo.db_service_key
  );
  
  // Cache the client
  tenantClientsCache.set(subdomain, tenantClient);
  
  return tenantClient;
}

/**
 * Get the appropriate Supabase client based on current subdomain
 */
export async function getCurrentClient() {
  const subdomain = getCurrentSubdomain();
  return await getTenantClient(subdomain);
}

/**
 * Clear the client cache (useful for testing or when tenant info changes)
 */
export function clearClientCache() {
  tenantClientsCache.clear();
}

/**
 * Store data in the appropriate tenant database
 */
export async function storeDataForCurrentTenant(table, data) {
  try {
    const client = await getCurrentClient();
    
    const { data: result, error } = await client
      .from(table)
      .insert(data);
    
    if (error) {
      console.error(`Error storing data in ${table}:`, error);
      throw error;
    }
    
    return result;
  } catch (err) {
    console.error("Unexpected error storing tenant data:", err);
    throw err;
  }
}

/**
 * Fetch data from the appropriate tenant database
 */
export async function fetchDataForCurrentTenant(table, query = {}) {
  try {
    const client = await getCurrentClient();
    
    let queryBuilder = client.from(table);
    
    // Apply query filters if provided
    if (query.select) {
      queryBuilder = queryBuilder.select(query.select);
    } else {
      queryBuilder = queryBuilder.select("*");
    }
    
    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
    }
    
    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, query.order.options);
    }
    
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error(`Error fetching data from ${table}:`, error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Unexpected error fetching tenant data:", err);
    throw err;
  }
}