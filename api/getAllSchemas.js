import { createClient } from "../src/lib/supabase/server.js";

export default async function handler(req, res) {
  let supabase;
  try {
    console.log("Initializing Supabase client...");
    supabase = createClient(); // Make sure this function returns a client or throws

    if (!supabase) {
      throw new Error("Supabase client not initialized properly!");
    }

    console.log("Calling RPC get_all_schemas...");
    const { data: schemas, error } = await supabase.rpc("get_all_schemas");

    console.log("👉 Raw schemas response:", schemas);
    console.log("👉 Error from Supabase (if any):", error);

    if (error) {
      console.error("Supabase RPC error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      schemas,
      totalSchemas: schemas?.length || 0,
    });
  } catch (err) {
    console.error("Failed to fetch schemas:", err);
    console.log("Error type:", typeof err, "Error stack:", err.stack);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
