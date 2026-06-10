// pages/api/getTableData.js
import { createClient } from "../src/lib/supabase/server.js";


export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { schema = "public", table, limit = 100 } = req.query;

    if (!table) {
      return res.status(400).json({ error: "Table name is required" });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_table_data", {
      schema_name: schema,
      table_name: table,
      limit_rows: parseInt(limit, 10),
    });

    if (error) {
      console.error("Supabase error (get table data):", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      schema,
      table,
      rows: data || [],
      rowCount: data?.length || 0,
    });
  } catch (err) {
    console.error("Failed to fetch table data:", err);
    return res.status(500).json({ error: err.message });
  }
}
