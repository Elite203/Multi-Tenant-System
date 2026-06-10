// pages/api/capture-schema.js
import { createClient } from "../src/lib/supabase/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = await createClient();
    const { comment, schemaName = "public" } = req.body;

    if (!comment) {
      return res
        .status(400)
        .json({ error: "Comment is required when syncing schema" });
    }

    // --- Call RPCs separately ---
    const { data: tables, error: tablesError } = await supabase.rpc(
      "capture_all_schema_snapshots",
      { p_comment: comment }
    );
    if (tablesError) throw new Error("Tables fetch error: " + tablesError.message);

    const { data: enums, error: enumsError } = await supabase.rpc("fetch_enum_types");
    if (enumsError) throw new Error("Enums fetch error: " + enumsError.message);

    const { data: functions, error: functionsError } = await supabase.rpc("fetch_db_functions");
    if (functionsError) throw new Error("Functions fetch error: " + functionsError.message);

    const { data: triggers, error: triggersError } = await supabase.rpc("fetch_db_triggers");
    if (triggersError) throw new Error("Triggers fetch error: " + triggersError.message);

    const { data: buckets, error: bucketsError } = await supabase.rpc("get_all_buckets");
    if (bucketsError) throw new Error("Buckets fetch error: " + bucketsError.message);

    // ✅ NEW RPC for RLS Policies
    const { data: policies, error: policiesError } = await supabase.rpc("get_all_rls_policies");
    if (policiesError) throw new Error("Policies fetch error: " + policiesError.message);

    // --- Insert into schema_versions in one row ---
    const { data: insertData, error: insertError } = await supabase
      .from("schema_versions")
      .insert([
        {
          schema_name: schemaName,
          snapshot: tables,   // tables schema snapshot
          enums: enums,
          functions: functions,
          triggers: triggers,
          buckets: buckets,
          policies: policies, // ✅ NEW FIELD
          comment: comment,
        },
      ])
      .select()
      .single();

    if (insertError) throw new Error("Insert error: " + insertError.message);

    return res.status(200).json({
      success: true,
      message:
        "Schema (tables, enums, functions, triggers, buckets, policies) synced successfully",
      snapshot: insertData,
    });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
