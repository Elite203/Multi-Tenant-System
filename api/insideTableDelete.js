// pages/api/deleteRow.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { schema, table, id } = req.body;
    const supabase = await createClient();

    if (!schema || !table || !id) {
      return res
        .status(400)
        .json({ error: "schema, table, and id are required" });
    }

    const { error } = await supabase.rpc("delete_row", {
      schema_name: schema,
      table_name: table,
      row_id: id,
    });

    if (error) {
      console.error("Supabase error (delete row):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Row with ID ${id} deleted from ${schema}.${table}`,
    });
  } catch (err) {
    console.error("Failed to delete row:", err);
    return res.status(500).json({ error: err.message });
  }
}
