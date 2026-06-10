// pages/api/createSchema.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { schemaName } = req.body;

    if (!schemaName) {
      return res.status(400).json({ error: "Schema name is required" });
    }

    // Call the RPC function
    const { error } = await supabase.rpc("create_schema", {
      schema_to_create: schemaName,
    });

    if (error) {
      console.error("Supabase error (create schema):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Schema '${schemaName}' created (if it did not already exist).`,
    });
  } catch (err) {
    console.error("Failed to create schema:", err);
    return res.status(500).json({ error: err.message });
  }
}
