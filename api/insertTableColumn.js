// pages/api/addColumn.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { schemaName, tableName, columnName, columnType, defaultValue, isNullable } =
      req.body;

    if (!schemaName || !tableName || !columnName || !columnType) {
      return res.status(400).json({
        error: "schemaName, tableName, columnName, and columnType are required",
      });
    }

    const { error } = await supabase.rpc("add_column_to_table", {
      schema_name: schemaName,
      table_name: tableName,
      column_name: columnName,
      column_type: columnType,
      default_value: defaultValue || null,
      is_nullable: isNullable !== undefined ? isNullable : true,
    });

    if (error) {
      console.error("Supabase error (add column):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Column '${columnName}' added to table '${schemaName}.${tableName}' successfully`,
    });
  } catch (err) {
    console.error("Failed to add column:", err);
    return res.status(500).json({ error: err.message });
  }
}
