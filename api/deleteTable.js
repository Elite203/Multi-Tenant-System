// pages/api/deleteTable.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { schemaName, tableName } = req.body;

    if (!schemaName || !tableName) {
      return res.status(400).json({
        error: "Schema name and table name are required",
      });
    }

    const { error } = await supabase.rpc("delete_table_in_schema", {
      schema_name: schemaName,
      table_name: tableName,
    });

    if (error) {
      console.error("Supabase error (delete table):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Table '${schemaName}.${tableName}' deleted (if it existed).`,
    });
  } catch (err) {
    console.error("Failed to delete table:", err);
    return res.status(500).json({ error: err.message });
  }
}
