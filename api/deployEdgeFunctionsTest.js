import { execSync } from "child_process";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { masterRef } = req.body;
  if (!masterRef) return res.status(400).json({ error: "Missing masterRef" });

  try {
    // List all functions from master project as JSON
    const listJson = execSync(
      `supabase functions list --project-ref ${masterRef} --json`,
      {
        env: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN },
        encoding: "utf-8",
      }
    );

    const functions = JSON.parse(listJson);

    return res.status(200).json({ functions });
  } catch (err) {
    return res.status(500).json({ error: "Failed to list functions", details: err.message });
  }
}
