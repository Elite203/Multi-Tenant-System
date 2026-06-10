// pages/api/githubDeleteSubBranch.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, branchName } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !branchName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!token) {
    return res.status(500).json({ error: "GITHUB_TOKEN not set in env" });
  }

  try {
    const deleteRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (deleteRes.status === 204) {
      return res.status(200).json({
        success: true,
        message: `Branch '${branchName}' deleted successfully.`,
      });
    } else if (deleteRes.status === 404) {
      return res.status(404).json({
        error: "Branch not found",
        details: `No branch named '${branchName}' exists.`,
      });
    } else {
      const errData = await deleteRes.json().catch(() => ({}));
      return res.status(deleteRes.status).json({
        error: "Failed to delete branch",
        details: errData,
      });
    }
  } catch (err) {
    console.error("GitHub API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
