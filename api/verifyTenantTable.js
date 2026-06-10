import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const MASTER_SUPABASE_URL = process.env.MASTER_SUPABASE_URL;
    const MASTER_SUPABASE_KEY = process.env.MASTER_SUPABASE_KEY;
    
    if (!MASTER_SUPABASE_URL || !MASTER_SUPABASE_KEY) {
      return res.status(500).json({
        error: "Missing master database configuration",
        variables: {
          url: !!MASTER_SUPABASE_URL,
          key: !!MASTER_SUPABASE_KEY
        }
      });
    }

    const masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);

    // Try to select from tenants table to see if it exists
    const { data, error } = await masterClient
      .from("tenants")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Tenants table error:", error);
      
      if (error.code === "42P01") { // Table doesn't exist
        // Try to create the table
        const { error: createError } = await masterClient.rpc('create_tenants_table');
        
        if (createError) {
          console.error("❌ Failed to create tenants table:", createError);
          return res.status(500).json({
            error: "Tenants table doesn't exist and couldn't be created",
            details: createError.message,
            suggestion: "Please create the tenants table manually in your Supabase database"
          });
        }
        
        return res.status(200).json({
          message: "Tenants table created successfully",
          created: true
        });
      }
      
      return res.status(500).json({
        error: "Database error accessing tenants table",
        details: error.message,
        hint: error.hint
      });
    }

    return res.status(200).json({
      message: "Tenants table exists and is accessible",
      exists: true,
      sampleData: data
    });

  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message
    });
  }
}