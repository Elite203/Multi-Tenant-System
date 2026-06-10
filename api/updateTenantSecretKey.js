import { createClient } from "@supabase/supabase-js";

const MASTER_SUPABASE_URL = process.env.MASTER_SUPABASE_URL;
const MASTER_SUPABASE_KEY = process.env.MASTER_SUPABASE_KEY;

const masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", method: req.method });
    }

    const { subdomain, secretKey } = req.body || {};

    // Validate required fields
    if (!subdomain || !secretKey) {
      return res.status(400).json({
        error: "Missing required fields: subdomain, secretKey",
      });
    }

    console.log("🔄 Updating tenant secret key for subdomain:", subdomain);

    // Update tenant record with secret key
    const { data, error } = await masterClient
      .from("tenants")
      .update({ tenantservicekey: secretKey })
      .eq("subdomain", subdomain)
      .select();

    if (error) {
      console.error("❌ Failed to update tenant secret key:", error.message);
      return res.status(500).json({
        error: "Failed to update tenant secret key",
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      console.error("❌ No tenant found with subdomain:", subdomain);
      return res.status(404).json({
        error: "Tenant not found",
        details: `No tenant found with subdomain: ${subdomain}`,
      });
    }

    console.log("✅ Tenant secret key updated successfully:", data[0]);

    return res.status(200).json({
      message: "Tenant secret key updated successfully",
      tenant: data[0],
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}