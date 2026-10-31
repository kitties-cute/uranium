
const supabase = require("../lib/supabase");
const { getSessionUser } = require("../lib/auth");

const DEFAULT_AVATAR = {
  head_color: 24,
  torso_color: 23,
  left_arm_color: 24,
  right_arm_color: 24,
  left_leg_color: 37,
  right_leg_color: 37,
  hat_1: null,
  hat_2: null,
  hat_3: null,
  shirt: null,
  pants: null,
  t_shirt: null
};

// Keep this list in sync with the BrickColor choices in avatar.html.
const ALLOWED_COLORS = new Set([
  1, 5, 21, 23, 24, 26, 28, 37,
  100, 101, 102, 104, 105, 106, 107, 108, 110
]);

const COLOR_KEYS = [
  "head_color",
  "torso_color",
  "left_arm_color",
  "right_arm_color",
  "left_leg_color",
  "right_leg_color"
];

const ASSET_KEYS = [
  "hat_1",
  "hat_2",
  "hat_3",
  "shirt",
  "pants",
  "t_shirt"
];

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    const host =
      req.headers["x-forwarded-host"] || req.headers.host;

    return Boolean(host) && parsed.host === host;
  } catch {
    return false;
  }
}

function validateAvatar(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Avatar data must be a JSON object." };
  }

  const avatar = { ...DEFAULT_AVATAR };

  for (const key of COLOR_KEYS) {
    const value = input[key];

    if (!Number.isInteger(value) || !ALLOWED_COLORS.has(value)) {
      return {
        error: `Invalid ${key}. Please choose a supported body color.`
      };
    }

    avatar[key] = value;
  }

  // Clothing and accessory slots are reserved for the catalog system.
  for (const key of ASSET_KEYS) {
    const value = Object.prototype.hasOwnProperty.call(input, key)
      ? input[key]
      : null;

    if (
      value !== null &&
      !(typeof value === "string" && value.length <= 100) &&
      !(Number.isSafeInteger(value) && value >= 0)
    ) {
      return { error: `Invalid ${key} value.` };
    }

    avatar[key] = value;
  }

  return { avatar };
}

module.exports = async function handler(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  res.setHeader("Cache-Control", "no-store, private");

  if (!isSameOrigin(req)) {
    return res.status(403).json({
      error: "Request origin not allowed."
    });
  }

  try {
    const session = getSessionUser(req);

    if (!session) {
      return res.status(401).json({
        error: "Please log in first."
      });
    }

    const checked = validateAvatar(
      req.body && req.body.avatardata
    );

    if (checked.error) {
      return res.status(400).json({
        error: checked.error
      });
    }

    const { data: user, error } = await supabase
      .from("uranium_users")
      .update({
        avatardata: checked.avatar
      })
      .eq("id", session.sub)
      .select("avatardata")
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({
        error: "Account not found."
      });
    }

    return res.status(200).json({
      message: "Avatar saved!",
      user: {
        avatardata: user.avatardata
      }
    });

  } catch (error) {
    console.error("Avatar save error:", error.message);

    return res.status(500).json({
      error: "Could not save your avatar."
    });
  }
};
