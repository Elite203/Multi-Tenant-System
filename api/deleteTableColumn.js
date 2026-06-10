// pages/api/deleteColumn.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { schemaName, tableName, columnName } = req.body;

    if (!schemaName || !tableName || !columnName) {
      return res.status(400).json({
        error: "schemaName, tableName, and columnName are required",
      });
    }

    const { error } = await supabase.rpc("delete_column_from_table", {
      schema_name: schemaName,
      table_name: tableName,
      column_name: columnName,
    });

    if (error) {
      console.error("Supabase error (delete column):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Column '${columnName}' deleted from table '${schemaName}.${tableName}' successfully`,
    });
  } catch (err) {
    console.error("Failed to delete column:", err);
    return res.status(500).json({ error: err.message });
  }
}
