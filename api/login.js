const supabase = require("../lib/supabase");

const {
  verifyPassword,
  createSession,
  setSessionCookie,
  checkSameOrigin
} = require("../lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  if (!checkSameOrigin(req)) {
    return res.status(403).json({
      error: "Invalid request origin."
    });
  }

  try {
    const username = String(
      req.body?.username || ""
    ).trim().toLowerCase();

    const password = req.body?.password;

    if (
      !/^[a-z0-9_]{3,20}$/.test(username) ||
      typeof password !== "string" ||
      password.length < 1 ||
      password.length > 128
    ) {
      return res.status(401).json({
        error: "Incorrect username or password."
      });
    }

    const { data: user, error } = await supabase
      .from("uranium_users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Database login error:", error.message);

      return res.status(500).json({
        error: "Could not log in."
      });
    }

    if (
      !user ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      return res.status(401).json({
        error: "Incorrect username or password."
      });
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

    return res.status(500).json({
      error: "Internal server error."
    });
  }
};
