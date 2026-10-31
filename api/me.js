
const supabase = require("../lib/supabase");
const { getSessionUser } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  res.setHeader("Cache-Control", "no-store, private");

  try {
    const session = getSessionUser(req);

    if (!session) {
      return res.status(401).json({
        error: "Not logged in."
      });
    }

    const { data: user, error } = await supabase
      .from("uranium_users")
      .select(
        "id, username, urabux, avatardata, gender, profile_about, email, pfp_url"
      )
      .eq("id", session.sub)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        error: "Account not found."
      });
    }

    return res.status(200).json({
      user
    });

  } catch (error) {
    console.error("Session error:", error.message);

    return res.status(500).json({
      error: "Internal server error."
    });
  }
};
