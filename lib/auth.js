const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "uranium_session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 bytes."
    );
  }

  return secret;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createSession(userId) {
  return jwt.sign(
    { sub: userId },
    getSecret(),
    {
      algorithm: "HS256",
      expiresIn: SESSION_DURATION
    }
  );
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production"
    ? "; Secure"
    : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION}${secure}`
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production"
    ? "; Secure"
    : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  );
}

function getSessionUser(req) {
  const token = getCookie(req, COOKIE_NAME);

  if (!token) return null;

  try {
    const payload = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"]
    });

    if (!payload.sub) return null;

    return payload;
  } catch {
    return null;
  }
}

function checkSameOrigin(req) {
  const origin = req.headers.origin;

  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const host = req.headers["x-forwarded-host"] ||
      req.headers.host;

    return originUrl.host === host;
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  checkSameOrigin
};
