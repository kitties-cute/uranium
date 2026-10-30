
module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");

  try {
    const {
      SUPABASE_URL,
      SUPABASE_SECRET_KEY,
      SUPABASE_PUBLISHABLE_KEY
    } = process.env;

    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !SUPABASE_PUBLISHABLE_KEY
    ) {
      return res.status(500).json({
        error: "Server configuration error"
      });
    }

    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length < 3 ||
      username.length > 20 ||
      password.length === 0 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error: "Please enter a valid username and password."
      });
    }

    const cleanUsername = username.toLowerCase();

    // Find the account's user ID from the profiles table
    const profileUrl = new URL(
      "/rest/v1/profiles",
      SUPABASE_URL
    );

    profileUrl.searchParams.set(
      "username",
      `eq.${cleanUsername}`
    );
    profileUrl.searchParams.set("select", "id");

    const profileResponse = await fetch(profileUrl, {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error("Profile lookup failed");
    }

    const profiles = await profileResponse.json();

    if (!profiles.length) {
      return res.status(401).json({
        error: "Invalid username or password."
      });
    }

    // Retrieve the email associated with that user ID
    const userResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${profiles[0].id}`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error("User lookup failed");
    }

    const userData = await userResponse.json();

    if (!userData.email) {
      return res.status(401).json({
        error: "Invalid username or password."
      });
    }

    // Sign in using the user's email and password
    const loginResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userData.email,
          password
        })
      }
    );

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      return res.status(401).json({
        error: "Invalid username or password."
      });
    }

    return res.status(200).json({
      access_token: loginData.access_token,
      refresh_token: loginData.refresh_token
    });

  } catch (error) {
    // Do not log passwords, tokens, or secret keys
    console.error("Login request failed");

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
};
