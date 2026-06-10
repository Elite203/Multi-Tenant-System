import { createClient } from "../src/lib/supabase/server.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { schemaName = "public", tableName, columns, rowData } = req.body;
      const supabase = await createClient();

      if (!tableName || !columns || columns.length === 0) {
        return res.status(400).json({
          error: "tableName and at least one column are required",
        });
      }

      // 1️⃣ Build CREATE TABLE SQL
      const columnDefs = columns
        .map(
          (col) =>
            `${col.name} ${col.type}${col.isNullable === false ? " NOT NULL" : ""}${
              col.isPrimary ? " PRIMARY KEY" : ""
            }${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ""}`
        )
        .join(", ");

      const ddl = `CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (${columnDefs});`;

      // 2️⃣ Run CREATE TABLE
      const { error: ddlError } = await supabase.rpc("exec_sql", { sql: ddl });
      if (ddlError) {
        return res.status(500).json({ error: ddlError.message });
      }

      // 2️⃣a Enable Row Level Security (RLS)
      const { error: rlsError } = await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE ${schemaName}.${tableName} ENABLE ROW LEVEL SECURITY;`,
      });
      if (rlsError) {
        return res.status(500).json({ error: rlsError.message });
      }

      // 3️⃣ Insert initial row if provided
      if (rowData) {
        const keys = Object.keys(rowData).join(", ");
        const values = Object.values(rowData)
          .map((v) => (typeof v === "string" ? `'${v}'` : v))
          .join(", ");
        const insertSql = `INSERT INTO ${schemaName}.${tableName} (${keys}) VALUES (${values});`;

        const { error: insertError } = await supabase.rpc("exec_sql", { sql: insertSql });
        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Table '${schemaName}.${tableName}' created successfully with RLS enabled${
          rowData ? " and initial row" : ""
        }.`,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
