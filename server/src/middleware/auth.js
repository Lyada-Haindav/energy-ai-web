import { authenticateSession } from "../services/authService.js";

function extractBearerToken(header) {
  const match = String(header || "").match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const auth = await authenticateSession(token);

    if (!auth) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.authToken = token;
    req.user = auth.user;
    req.sessionId = auth.sessionId;
    return next();
  } catch (error) {
    return next(error);
  }
}
