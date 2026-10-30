const {
  clearSessionCookie,
  checkSameOrigin
} = require("../lib/auth");

module.exports = function handler(req, res) {
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

  clearSessionCookie(res);

  return res.status(200).json({
    success: true
  });
};
