const supabase = require("../lib/supabase");
const { hashPassword, createSession, setSessionCookie } =
  require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const {
      username,
      password,
      birthday,
      gender
    } = req.body || {};

    const cleanUsername = String(username || "").trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: "Username must be 3–20 characters using letters, numbers, or underscores."
      });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: "Password must be between 8 and 128 characters."
      });
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from("uranium_users")
      .insert({
        username: cleanUsername,
        password_hash: passwordHash,
        birthday: birthday || null,
        gender: gender || null
      })
      .select("id, username")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "That username is already taken." });
      }

      throw error;
    }

    const token = createSession(data.id);
    setSessionCookie(res, token);

    return res.status(201).json({
      success: true,
      user: {
        id: data.id,
        username: data.username
      }
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};
