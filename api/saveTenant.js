import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    // Read environment variables
    const MASTER_SUPABASE_URL = process.env.MASTER_SUPABASE_URL;
    const MASTER_SUPABASE_KEY = process.env.MASTER_SUPABASE_KEY;
    
    console.log("🔍 Environment check - Master DB URL exists:", !!MASTER_SUPABASE_URL);
    console.log("🔍 Environment check - Master DB Key exists:", !!MASTER_SUPABASE_KEY);
    
    if (MASTER_SUPABASE_KEY) {
      console.log("🔍 Master DB Key starts with:", MASTER_SUPABASE_KEY.substring(0, 20) + "...");
    }
    
    // Create master client (for inserting tenants)
    const masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);
    
    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", method: req.method });
    }

    const { subdomain, name, db_name, db_pass, tenantid } = req.body || {};

    // Validate required fields
    if (!subdomain || !name || !db_name) {
      return res.status(400).json({
        error: "Missing required fields: subdomain, name, db_name",
        received: { subdomain: !!subdomain, name: !!name, db_name: !!db_name, tenantid: !!tenantid }
      });
    }

    // Validate Supabase client configuration
    if (!MASTER_SUPABASE_URL || !MASTER_SUPABASE_KEY) {
      console.error("❌ Missing master database configuration");
      return res.status(500).json({
        error: "Server configuration error: Missing master database credentials"
      });
    }

    console.log("💾 Saving tenant to master database:", { subdomain, name, db_name, tenantid });

    // Save tenant into master DB
    const { data, error } = await masterClient.from("tenants").insert([
      { 
        subdomain, 
        name, 
        dbname: db_name,
        dbpass: db_pass,
        tenantid: tenantid
      },
    ]).select();

    if (error) {
      console.error("❌ Database insert error:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error details:", error.details);
      return res.status(500).json({
        error: "Failed to save tenant to database",
        details: error.message,
        hint: error.hint || "Check database connection and table structure",
        code: error.code
      });
    }

    console.log("✅ Tenant saved to master database:", data);

    // ✅ Respond with tenant info
    res.status(200).json({
      message: "Tenant saved successfully",
      tenant: data && data[0] ? data[0] : { subdomain, name, dbname: db_name, tenantid },
    });

  } catch (err) {
    console.error("💥 Unexpected error:", err);
    
    // Ensure we always return JSON
    const errorResponse = {
      error: "Unexpected server error",
      details: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    };
    
    // Set proper content type to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse);
  }
}