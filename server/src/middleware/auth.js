const jwt = require("jsonwebtoken");

// Reads "Authorization: Bearer <token>" and attaches req.user = { id, username }
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be logged in to do that." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session is invalid or expired. Please log in again." });
  }
}

// Like requireAuth, but doesn't fail if there's no token — just leaves req.user undefined.
// Useful for routes that behave slightly differently for logged-in vs anonymous viewers.
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.id, username: payload.username };
    } catch (err) {
      // ignore invalid token for optional routes
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
