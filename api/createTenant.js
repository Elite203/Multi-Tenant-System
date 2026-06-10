import { createClient } from "@supabase/supabase-js";

const MASTER_SUPABASE_URL = process.env.MASTER_SUPABASE_URL;
const MASTER_SUPABASE_KEY = process.env.MASTER_SUPABASE_KEY;
const SUPABASE_MANAGEMENT_KEY = process.env.SUPABASE_MANAGEMENT_KEY;

const masterClient = createClient(MASTER_SUPABASE_URL, MASTER_SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", method: req.method });
    }

    const { subdomain, name, db_name, db_pass, secretKey } = req.body || {};

    // Validate required fields
    if (!subdomain || !name || !db_name || !db_pass) {
      return res.status(400).json({
        error: "Missing required fields: subdomain, name, db_name, db_pass",
      });
    }

    // Secret key is required **only before inserting tenant data**
    if (!secretKey) {
      return res.status(400).json({
        error: "Secret key is required to insert tenant data",
      });
    }

    if (!SUPABASE_MANAGEMENT_KEY) {
      return res.status(500).json({ error: "Missing management key" });
    }

    // 1️⃣ Create Supabase project
    const projectRes = await fetch("https://api.supabase.com/v1/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_MANAGEMENT_KEY}`,
      },
      body: JSON.stringify({
        name: db_name,
        organization_id: "cdqxaoesmxtvnrrjudmq",
        region: "eu-west-2",
        db_pass,
        plan: "free",
      }),
    });

    const projectText = await projectRes.text();
    if (!projectRes.ok) {
      console.error("❌ Project creation failed:", projectText);
      return res.status(projectRes.status).json({
        error: "Project creation failed",
        details: projectText,
      });
    }

    const projectData = JSON.parse(projectText);
    console.log("✅ Project created successfully:", projectData);

    const projectId = projectData.id;

    // 2️⃣ Insert tenant into master DB with manually provided secret key
    const { error: insertError } = await masterClient.from("tenants").insert([
      {
        subdomain,
        name,
        dbname: db_name,
        dbpass,
        tenantid: projectId,
        tenantservicekey: secretKey,
      },
    ]);

    if (insertError) {
      console.error("❌ Failed to save tenant:", insertError.message);
      return res.status(500).json({
        error: "Failed to save tenant to database",
        details: insertError.message,
      });
    }

    console.log("✅ Tenant inserted successfully into master DB");

    return res.status(200).json({
      message: "Tenant created successfully",
      project: projectData,
      tenant: {
        subdomain,
        name,
        dbname: db_name,
        dbpass,
        tenantid: projectId,
        tenantservicekey: secretKey,
      },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}
