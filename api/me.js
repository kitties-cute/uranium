const supabase = require("../lib/supabase");
const { getSessionUser } = require("../lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const session = getSessionUser(req);

    if (!session) {
      return res.status(401).json({
        error: "Not logged in."
      });
    }

    const { data, error } = await supabase
      .from("uranium_users")
      .select("id, username")
      .eq("id", session.sub)
      .maybeSingle();

    if (error) {
      console.error("Session database error:", error.message);

      return res.status(500).json({
        error: "Could not check your session."
      });
    }

    if (!data) {
      return res.status(401).json({
        error: "Account not found."
      });
    }

    return res.status(200).json({
      user: data
    });

  } catch (error) {
    console.error("Session error:", error.message);

    return res.status(500).json({
      error: "Could not check your session."
    });
  }
};
