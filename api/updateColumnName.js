import { createClient } from "../src/lib/supabase/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { schemaName, tableName, oldColumnName, newColumnName } = req.body;
    const supabase = await createClient();

    if (!schemaName || !tableName || !oldColumnName || !newColumnName) {
      return res.status(400).json({
        error: "schemaName, tableName, oldColumnName, and newColumnName are required",
      });
    }

    const { error } = await supabase.rpc("rename_table_column", {
      schema_name: schemaName,
      table_name: tableName,
      old_column_name: oldColumnName,
      new_column_name: newColumnName,
    });

    if (error) {
      console.error("Supabase error (rename column):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Column '${oldColumnName}' renamed to '${newColumnName}' in ${schemaName}.${tableName} successfully`,
    });
  } catch (err) {
    console.error("Failed to rename column:", err);
    return res.status(500).json({ error: err.message });
  }
}
