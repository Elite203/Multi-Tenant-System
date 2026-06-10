// pages/api/updateRow.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log('METHOD:', req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { schemaName, tableName, idColumn, idValue, updates } = req.body;
    const supabase = await createClient();

    if (!schemaName || !tableName || !idColumn || !idValue || !updates) {
      return res.status(400).json({
        error: "schemaName, tableName, idColumn, idValue, and updates are required",
      });
    }

    const { error } = await supabase.rpc("update_table_row", {
      schema_name: schemaName,
      table_name: tableName,
      row_id_column: idColumn,
      row_id_value: idValue,
      update_data: updates,
    });

    if (error) {
      console.error("Supabase error (update row):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Row in ${schemaName}.${tableName} updated successfully`,
    });
  } catch (err) {
    console.error("Failed to update row:", err);
    return res.status(500).json({ error: err.message });
  }
}
