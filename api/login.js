const supabase = require("../lib/supabase");
const {
  verifyPassword,
  createSession,
  setSessionCookie
} = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = req.body?.password;

    if (!username || typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const { data: user, error } = await supabase
      .from("uranium_users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const token = createSession(user.id);
    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};
