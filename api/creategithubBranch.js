// pages/api/createBranch.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, newBranch, baseBranch } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !newBranch || !baseBranch) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!token) {
    return res.status(500).json({ error: "GITHUB_TOKEN not set in env" });
  }

  try {
    // 1️⃣ Get SHA of base branch
    const baseRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!baseRefRes.ok) {
      const errData = await baseRefRes.json();
      return res.status(baseRefRes.status).json({ error: "Failed to get base branch SHA", details: errData });
    }

    const baseRef = await baseRefRes.json();
    const sha = baseRef.object.sha;

    // 2️⃣ Create new branch
    const createRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha: sha,
        }),
      }
    );

    if (!createRefRes.ok) {
      const errData = await createRefRes.json();
      return res.status(createRefRes.status).json({ error: "Failed to create branch", details: errData });
    }

    const createRef = await createRefRes.json();

    return res.status(200).json({
      success: true,
      message: `Branch '${newBranch}' created from '${baseBranch}'`,
      data: createRef,
    });
  } catch (err) {
    console.error("GitHub API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
