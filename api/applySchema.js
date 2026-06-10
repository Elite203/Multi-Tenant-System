import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import fetch from "node-fetch"; // make sure to install node-fetch

const MASTER_SUPABASE_URL = process.env.MASTER_SUPABASE_URL;
const MASTER_SUPABASE_KEY = process.env.MASTER_SUPABASE_KEY;
const masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);

// Helper: get existing schemas
async function getExistingSchemas(client) {
  const { rows } = await client.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name <> 'information_schema'`
  );
  return rows.map(r => r.schema_name);
}

// Step 1️⃣ Schemas (with drop)
async function applySchemas(client, schemaJson) {
  const results = [];
  const desiredSchemas = [...new Set(schemaJson.map(t => t.schema_name))];
  const existingSchemas = await getExistingSchemas(client);

  for (const schema of desiredSchemas) {
    try {
      if (!existingSchemas.includes(schema)) {
        await client.query(`CREATE SCHEMA "${schema}"`);
        results.push({ schema, status: "created" });
      } else {
        results.push({ schema, status: "exists" });
      }
    } catch (err) {
      results.push({ schema, status: "failed", error: err.message });
    }
  }

  for (const schema of existingSchemas) {
    if (!desiredSchemas.includes(schema)) {
      try {
        await client.query(`DROP SCHEMA "${schema}" CASCADE`);
        results.push({ schema, status: "dropped" });
      } catch (err) {
        results.push({ schema, status: "drop_failed", error: err.message });
      }
    }
  }

  return results;
}

// Step 2️⃣ Enums (with drop)
async function applyEnums(client, enumsJson) {
  const results = [];
  if (!enumsJson) return results;

  const { rows: existingRows } = await client.query(
    `SELECT typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY typname`
  );
  const existingEnums = existingRows.map(r => r.typname);

  for (const enumObj of enumsJson) {
    const { name, values } = enumObj;
    try {
      if (!existingEnums.includes(name)) {
        const valuesList = values.map(v => `'${v}'`).join(", ");
        await client.query(`CREATE TYPE "${name}" AS ENUM (${valuesList})`);
        results.push({ enum: name, status: "created" });
      } else {
        const { rows: existingValuesRows } = await client.query(
          `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = $1`,
          [name]
        );
        const existingValues = existingValuesRows.map(r => r.enumlabel);
        for (const val of values) {
          if (!existingValues.includes(val)) {
            await client.query(`ALTER TYPE "${name}" ADD VALUE IF NOT EXISTS '${val}'`);
          }
        }
        results.push({ enum: name, status: "synced" });
      }
    } catch (err) {
      results.push({ enum: name, status: "failed", error: err.message });
    }
  }

  for (const e of existingEnums) {
    if (!enumsJson.find(en => en.name === e)) {
      try {
        await client.query(`DROP TYPE "${e}" CASCADE`);
        results.push({ enum: e, status: "dropped" });
      } catch (err) {
        results.push({ enum: e, status: "drop_failed", error: err.message });
      }
    }
  }

  return results;
}

// Step 3️⃣ Functions
async function applyFunctions(client, functionsJson) {
  const results = [];
  if (!functionsJson) return results;

  for (const fn of functionsJson) {
    try {
      if (!fn.sql) continue;
      await client.query(fn.sql.replace(/^CREATE FUNCTION/i, "CREATE OR REPLACE FUNCTION"));
      results.push({ function: fn.name, status: "success" });
    } catch (err) {
      results.push({ function: fn.name, status: "failed", error: err.message });
    }
  }

  return results;
}

// Step 4️⃣ Tables (full CRUD)
async function applyTables(client, schemaJson) {
  const results = [];

  const { rows: existingRows } = await client.query(
    `SELECT table_schema, table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT LIKE 'pg_%'`
  );
  const existingTables = existingRows.map(r => `${r.table_schema}.${r.table_name}`);

  for (const table of schemaJson) {
    try {
      const fullTableName = `${table.schema_name}.${table.table_name}`;
      const tableExists = existingTables.includes(fullTableName);

      if (!tableExists) {
        const cols = table.columns.map(col => {
          let type = col.data_type === "ARRAY" ? `${col.udt_name.replace(/^_/, "").toUpperCase()}[]`
            : col.data_type === "USER-DEFINED" ? `"${col.udt_name}"` : col.data_type.toUpperCase();
          const nullable = col.is_nullable === "NO" ? "NOT NULL" : "";
          const def = col.column_default ? `DEFAULT ${col.column_default}` : "";
          return `"${col.column_name}" ${type} ${def} ${nullable}`.trim();
        }).join(",\n");
        await client.query(`CREATE TABLE "${table.schema_name}"."${table.table_name}" (\n${cols}\n)`);
        await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" ENABLE ROW LEVEL SECURITY`);
        results.push({ table: fullTableName, status: "created" });
      } else {
        const { rows: existingCols } = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default, udt_name
           FROM information_schema.columns
           WHERE table_schema=$1 AND table_name=$2`,
          [table.schema_name, table.table_name]
        );
        const existingColsMap = Object.fromEntries(existingCols.map(c => [c.column_name, c]));

        for (const col of table.columns) {
          const type = col.data_type === "ARRAY" ? `${col.udt_name.replace(/^_/, "").toUpperCase()}[]`
            : col.data_type === "USER-DEFINED" ? `"${col.udt_name}"` : col.data_type.toUpperCase();
          const nullable = col.is_nullable === "NO" ? "NOT NULL" : "";
          const def = col.column_default ? `DEFAULT ${col.column_default}` : "";

          if (!existingColsMap[col.column_name]) {
            await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" ADD COLUMN "${col.column_name}" ${type} ${def} ${nullable}`);
          } else {
            const existing = existingColsMap[col.column_name];
            if (existing.udt_name !== col.udt_name || existing.data_type.toUpperCase() !== col.data_type.toUpperCase()) {
              await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" ALTER COLUMN "${col.column_name}" TYPE ${type} USING "${col.column_name}"::${type}`);
            }
            if ((existing.is_nullable === "YES" && col.is_nullable === "NO") || (existing.is_nullable === "NO" && col.is_nullable === "YES")) {
              if (col.is_nullable === "NO") {
                await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" ALTER COLUMN "${col.column_name}" SET NOT NULL`);
              } else {
                await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" ALTER COLUMN "${col.column_name}" DROP NOT NULL`);
              }
            }
          }
        }

        for (const existingCol of existingCols) {
          if (!table.columns.find(c => c.column_name === existingCol.column_name)) {
            await client.query(`ALTER TABLE "${table.schema_name}"."${table.table_name}" DROP COLUMN "${existingCol.column_name}" CASCADE`);
          }
        }

        results.push({ table: fullTableName, status: "synced" });
      }
    } catch (err) {
      results.push({ table: `${table.schema_name}.${table.table_name}`, status: "failed", error: err.message });
    }
  }

  for (const existingTable of existingTables) {
    const [schemaName, tableName] = existingTable.split(".");
    if (!schemaJson.find(t => t.schema_name === schemaName && t.table_name === tableName)) {
      try {
        await client.query(`DROP TABLE "${schemaName}"."${tableName}" CASCADE`);
        results.push({ table: existingTable, status: "dropped" });
      } catch (err) {
        results.push({ table: existingTable, status: "drop_failed", error: err.message });
      }
    }
  }

  return results;
}

// 🆕 Step 6️⃣ Constraints + Indexes
// ✅ Fixed applyConstraintsAndIndexes()
// 🆕 Robust applyConstraintsAndIndexes (replace the old one)
// 🔧 Fixed and dependency-safe version
async function applyConstraintsAndIndexes(client, schemaJson) {
  const results = { constraints: [], indexes: [] };

  function quoteIdent(s) {
    if (s === null || s === undefined) return '""';
    return '"' + String(s).replace(/"/g, '""') + '"';
  }

  const firstPass = []; // PK, UNIQUE
  const secondPass = []; // FK, CHECK

  // 🔹 Split constraints and indexes into passes
  for (const table of schemaJson) {
    const schema_name = table.schema_name;
    const table_name = table.table_name;
    const qualifiedTable = `${schema_name}.${table_name}`;
    const constraints = Array.isArray(table.constraints) ? table.constraints : [];
    const indexes = Array.isArray(table.indexes) ? table.indexes : [];

    for (const c of constraints) {
      if (!c || !c.constraint_name || !c.constraint_type) continue;
      const type = String(c.constraint_type).toUpperCase();
      if (type === "PRIMARY KEY" || type === "UNIQUE" || type === "P" || type === "U") {
        firstPass.push({ schema_name, table_name, qualifiedTable, c });
      } else {
        secondPass.push({ schema_name, table_name, qualifiedTable, c });
      }
    }

    // 🔹 Apply indexes (drop + recreate)
    for (const idx of indexes) {
      if (!idx?.index_name || !idx?.index_def) continue;
      try {
        console.debug(`🔹 Dropping and recreating index: ${idx.index_name}`);
        await client.query(`DROP INDEX IF EXISTS ${quoteIdent(idx.index_name)} CASCADE;`);
        console.debug(`   ↳ Running: ${idx.index_def}`);
        await client.query(idx.index_def);
        results.indexes.push({ index: idx.index_name, table: qualifiedTable, status: "applied" });
      } catch (err) {
        results.indexes.push({
          index: idx.index_name,
          table: qualifiedTable,
          status: "failed",
          error: err.message,
        });
      }
    }
  }

  // 🧱 Helper to build SQL constraint definition
  function buildConstraintSQL(schema_name, table_name, c) {
    let def = c?.constraint_def || c?.definition || "";
    const cols = (c.columns || []).map(col => `"${col}"`).join(", ");

    if (!def) {
      switch ((c.constraint_type || "").toLowerCase()) {
        case "p":
        case "primary key":
          def = `PRIMARY KEY (${cols})`;
          break;

        case "u":
        case "unique":
          def = `UNIQUE (${cols})`;
          break;

        case "f":
        case "foreign key":
          if (
            c.references &&
            c.references.referenced_table &&
            c.references.referenced_columns?.length
          ) {
            const refSchema = c.references.referenced_schema || "public";
            const refTable = c.references.referenced_table;
            const refCols = c.references.referenced_columns.map(col => `"${col}"`).join(", ");
            def = `FOREIGN KEY (${cols}) REFERENCES "${refSchema}"."${refTable}" (${refCols})`;
          }
          break;

        case "c":
        case "check":
          if (c.check_clause) {
            def = `CHECK (${c.check_clause})`;
          }
          break;
      }
    }

    if (!def) return null;

    return `ALTER TABLE ${quoteIdent(schema_name)}.${quoteIdent(table_name)} ADD CONSTRAINT ${quoteIdent(c.constraint_name)} ${def};`;
  }

  // --- ⚙️ Apply Constraints in Two Passes ---
  async function applyConstraintPass(passName, list) {
    for (const { schema_name, table_name, qualifiedTable, c } of list) {
      const sql = buildConstraintSQL(schema_name, table_name, c);
      if (!sql) {
        results.constraints.push({
          constraint: c.constraint_name,
          table: qualifiedTable,
          status: "skipped",
          pass: passName,
          error: "Missing or unsupported constraint definition",
        });
        continue;
      }

      try {
        // 🩹 Drop orphaned index/constraint if exists (avoids 'already exists' errors)
        await client.query(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${c.constraint_name}') THEN
              EXECUTE 'ALTER TABLE ${schema_name}.${table_name} DROP CONSTRAINT IF EXISTS ${c.constraint_name} CASCADE';
            ELSIF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${c.constraint_name}') THEN
              EXECUTE 'DROP INDEX IF EXISTS ${schema_name}.${c.constraint_name} CASCADE';
            END IF;
          END$$;
        `);

        await client.query(sql);
        results.constraints.push({
          constraint: c.constraint_name,
          table: qualifiedTable,
          status: "applied",
          pass: passName,
        });
      } catch (err) {
        results.constraints.push({
          constraint: c.constraint_name,
          table: qualifiedTable,
          status: "failed",
          pass: passName,
          error: err.message,
          attempted_sql: sql,
        });
      }
    }
  }

  // 1️⃣ Apply PK + UNIQUE first
  await applyConstraintPass("first", firstPass);

  // 2️⃣ Apply FK + CHECK second
  await applyConstraintPass("second", secondPass);

  return results;
}




// Step 5️⃣ Triggers
async function applyTriggers(client, triggersJson) {
  let applied = 0, skipped = 0;
  const missingFunctions = new Set();

  if (!triggersJson) return { applied, skipped, missingFunctions: [] };

  for (const trg of triggersJson) {
    const events = Array.isArray(trg.events) ? trg.events : [trg.event];
    if (!trg.name || !trg.table || !trg.function || !events.length) {
      skipped++;
      continue;
    }

    try {
      const funcParts = trg.function.split('.');
      let funcQuery = funcParts.length === 2
        ? `SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname=$1 AND n.nspname=$2`
        : `SELECT 1 FROM pg_proc WHERE proname=$1`;
      const funcValues = funcParts.length === 2 ? [funcParts[1], funcParts[0]] : [funcParts[0]];
      const funcCheck = await client.query(funcQuery, funcValues);

      if (funcCheck.rowCount === 0) {
        skipped++;
        missingFunctions.add(trg.function);
        continue;
      }

      await client.query(`DROP TRIGGER IF EXISTS "${trg.name}" ON "${trg.table}"`);

      for (const event of events) {
        await client.query(`
          CREATE TRIGGER "${trg.name}"
          ${trg.orientation === "ROW" ? "BEFORE" : "AFTER"} ${event}
          ON "${trg.table}" FOR EACH ${trg.orientation}
          EXECUTE FUNCTION ${trg.function}();
        `);
      }

      applied++;
    } catch {
      skipped++;
    }
  }

  return { applied, skipped, missingFunctions: Array.from(missingFunctions) };
}

async function applyRlsPolicies(client, policies) {
  const results = [];

  // Map single-letter internal PostgreSQL command codes to SQL keywords
  const commandMap = {
    r: "SELECT",
    a: "INSERT",
    w: "UPDATE",
    d: "DELETE",
    A: "ALL", // our custom handling for combined operations
    S: "SELECT",
    U: "UPDATE",
    I: "INSERT",
    D: "DELETE",
  };

  for (const policy of policies) {
    try {
      const {
        schema_name,
        table_name,
        policy_name,
        target_roles,
        is_rls_enabled,
        is_rls_forced,
        policy_command,
        policy_behavior,
        check_expression,
        using_expression,
      } = policy;

      const schemaTable = `"${schema_name}"."${table_name}"`;
      const roles = target_roles?.length
        ? target_roles.map((r) => `"${r}"`).join(", ")
        : "public";

      // Convert shorthand like 'A' or 'S' to actual SQL keyword
      const commandKeyword =
        commandMap[policy_command] || policy_command || "ALL";

      // Enable RLS on table if not enabled
      if (is_rls_enabled) {
        await client.query(`ALTER TABLE ${schemaTable} ENABLE ROW LEVEL SECURITY;`);
      }
      if (is_rls_forced) {
        await client.query(`ALTER TABLE ${schemaTable} FORCE ROW LEVEL SECURITY;`);
      }

      // Build the CREATE POLICY SQL
      let sql = `
        CREATE POLICY "${policy_name}"
        ON ${schemaTable}
        AS ${policy_behavior}
        FOR ${commandKeyword}
        TO ${roles}
      `;

      if (using_expression) sql += ` USING (${using_expression})`;
      if (check_expression) sql += ` WITH CHECK (${check_expression})`;

      sql += ";";

      await client.query(sql);
      results.push({
        table: `${schema_name}.${table_name}`,
        policy: policy_name,
        status: "applied",
      });
    } catch (err) {
      results.push({
        table: `${policy.schema_name}.${policy.table_name}`,
        policy: policy.policy_name,
        status: "failed",
        error: err.message,
      });
    }
  }

  return results;
}


// Main executor
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { tenantDbUrl } = req.body;
  if (!tenantDbUrl) return res.status(400).json({ error: "Missing tenantDbUrl" });

  const debugLogs = [];
  const logStep = (msg) => {
    console.log(msg);
    debugLogs.push(msg);
  };

  try {
    // 1️⃣ Fetch latest schema snapshot
    logStep("📦 Fetching latest schema snapshot...");
    const { data: latestSchemaVersion, error } = await masterClient
      .from("schema_versions")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error || !latestSchemaVersion)
      return res.status(500).json({ error: "Failed to fetch latest schema" });

    const schemaJson = latestSchemaVersion.snapshot;
    const enumsJson = latestSchemaVersion.enums || [];
    const functionsJson = latestSchemaVersion.functions || [];
    const triggersJson = latestSchemaVersion.triggers || [];
    const bucketsJson = latestSchemaVersion.buckets || [];
    const policiesJson = latestSchemaVersion.policies || [];

    // 2️⃣ Connect to tenant DB
    logStep("🔗 Connecting to tenant database...");
    const client = new Client({ connectionString: tenantDbUrl });
    await client.connect();

    const results = {};

    // 🧩 APPLY IN CUSTOM ORDER
    logStep("1️⃣ Applying schemas...");
    results.schemas = await applySchemas(client, schemaJson);

    logStep("2️⃣ Applying enums...");
    results.enums = await applyEnums(client, enumsJson);

    logStep("3️⃣ Applying functions (first pass, pre-tables)...");
    results.functions_pass1 = await applyFunctions(client, functionsJson);

    logStep("4️⃣ Applying tables...");
    results.tables = await applyTables(client, schemaJson);

    logStep("5️⃣ Applying functions (second pass, post-tables)...");
    results.functions_pass2 = await applyFunctions(client, functionsJson);

    logStep("6️⃣ Applying keys and indexes...");
    results.keys_and_indexes = await applyConstraintsAndIndexes(client, schemaJson);

    logStep("7️⃣ Applying triggers...");
    results.triggers = await applyTriggers(client, triggersJson);

    logStep("8️⃣ Applying RLS policies...");
    results.policies = await applyRlsPolicies(client, policiesJson);

    // 9️⃣ Sync Buckets (safe)
    results.buckets = [];
    if (bucketsJson.length > 0) {
      const match = tenantDbUrl.match(/postgres\.([^.]+):/);
      const extractedTenantId = match ? match[1] : null;

      if (!extractedTenantId) {
        results.buckets.push({ status: "skipped", error: "Could not extract tenantid from tenantDbUrl" });
        logStep("❌ Could not extract tenantid from tenantDbUrl.");
      } else {
        const { data: tenantRow, error: tenantError } = await masterClient
          .from("tenants")
          .select("tenantid, tenantservicekey, name, subdomain")
          .eq("tenantid", extractedTenantId)
          .single();

        if (tenantError || !tenantRow) {
          results.buckets.push({ status: "skipped", error: "Tenant not found in master DB" });
          logStep(`❌ Tenant not found for tenantid: ${extractedTenantId}`);
        } else {
          const selectedTenant = tenantRow;
          const tenantSupabaseUrl = `https://${selectedTenant.tenantid}.supabase.co`;
          const tenantServiceRoleKey = selectedTenant.tenantservicekey;

          logStep(`🟢 Syncing buckets for tenant: ${selectedTenant.name} (${selectedTenant.subdomain || "no-subdomain"})`);
          logStep(`   → URL: ${tenantSupabaseUrl}`);

          for (const b of bucketsJson) {
            try {
              const checkRes = await fetch(`${tenantSupabaseUrl}/storage/v1/bucket/${b.id}`, {
                method: "GET",
                headers: {
                  "apikey": tenantServiceRoleKey,
                  "Authorization": `Bearer ${tenantServiceRoleKey}`,
                },
              });

              if (checkRes.ok) {
                results.buckets.push({ tenant: selectedTenant.name, bucket: b.name, status: "exists" });
                logStep(`   ⚪ Bucket already exists: ${b.name}`);
                continue;
              }

              const createRes = await fetch(`${tenantSupabaseUrl}/storage/v1/bucket`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": tenantServiceRoleKey,
                  "Authorization": `Bearer ${tenantServiceRoleKey}`,
                },
                body: JSON.stringify({
                  id: b.id,
                  name: b.name,
                  public: b.public,
                }),
              });

              const createData = await createRes.json();
              if (!createRes.ok) throw new Error(JSON.stringify(createData));

              results.buckets.push({ tenant: selectedTenant.name, bucket: b.name, status: "created" });
              logStep(`   ✅ Created bucket: ${b.name}`);
            } catch (err) {
              results.buckets.push({
                tenant: selectedTenant.name,
                bucket: b.name,
                status: "failed",
                error: err.message,
              });
              logStep(`   ❌ Failed to sync bucket ${b.name}: ${err.message}`);
            }
          }
        }
      }
    } else {
      logStep("⚠️ No buckets to sync.");
    }

    await client.end();

    logStep("✅ Schema, functions, triggers, buckets, and policies applied successfully!");

    return res.status(200).json({
      message: "Schema (tables, enums, functions, triggers, buckets, policies) applied successfully",
      success: true,
      results,
      debugLogs,
    });
  } catch (err) {
    console.error("Error applying schema:", err);
    debugLogs.push(`❌ Error applying schema: ${err.message}`);
    return res.status(500).json({ error: "Failed to apply schema", details: err.message, debugLogs });
  }
}
