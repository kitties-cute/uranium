const supabase = require("../lib/supabase");

const {
  hashPassword,
  createSession,
  setSessionCookie,
  checkSameOrigin
} = require("../lib/auth");

function validBirthday(value) {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date <= new Date();
}

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
    const {
      username,
      password,
      birthday,
      gender
    } = req.body || {};

    if (typeof username !== "string") {
      return res.status(400).json({
        error: "Please enter a username."
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: "Username must be 3–20 characters and contain only letters, numbers, and underscores."
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error: "Password must be between 8 and 128 characters."
      });
    }

    if (!validBirthday(birthday)) {
      return res.status(400).json({
        error: "Please select a valid birthday."
      });
    }

    const allowedGenders = [
      "",
      "female",
      "male",
      "other",
      "prefer_not_to_say"
    ];

    if (
      gender !== null &&
      gender !== undefined &&
      !allowedGenders.includes(gender)
    ) {
      return res.status(400).json({
        error: "Invalid gender selection."
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
        return res.status(409).json({
          error: "That username is already taken."
        });
      }

      console.error("Database signup error:", error.message);
      return res.status(500).json({
        error: "Could not create your account."
      });
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

    return res.status(500).json({
      error: "Internal server error."
    });
  }
};
