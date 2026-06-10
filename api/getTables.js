// pages/api/getTablesBySchema.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();

    // Read schema name from query params (default: public)
    const { schema = "public" } = req.query;

    const { data: tables, error } = await supabase.rpc("get_tables_by_schema", {
      schema_name: schema,
    });

    console.log("👉 Schema:", schema);
    console.log("👉 Tables:", tables);

    if (error) {
      console.error("Supabase error (tables):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      schema,
      tables,
      totalTables: tables?.length || 0,
    });
  } catch (err) {
    console.error("Failed to fetch tables:", err);
    return res.status(500).json({ error: err.message });
  }
}
