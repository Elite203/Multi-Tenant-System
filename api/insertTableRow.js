// pages/api/insertRow.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { schemaName, tableName, rowData } = req.body;

    if (!schemaName || !tableName || !rowData) {
      return res.status(400).json({
        error: "schemaName, tableName, and rowData are required",
      });
    }

    const { error } = await supabase.rpc("insert_table_row", {
      schema_name: schemaName,
      table_name: tableName,
      row_data: rowData,
    });

    if (error) {
      console.error("Supabase error (insert row):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Row inserted into ${schemaName}.${tableName} successfully`,
    });
  } catch (err) {
    console.error("Failed to insert row:", err);
    return res.status(500).json({ error: err.message });
  }
}
