import express from "express";
import { cloneSessions, readDb, updateDb } from "../services/dataStore.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function sanitizeMessage(message) {
  return {
    id: String(message?.id || ""),
    role: String(message?.role || "assistant"),
    content: String(message?.content || ""),
    meta: message?.meta && typeof message.meta === "object" ? message.meta : undefined
  };
}

function sanitizeSession(session) {
  return {
    id: String(session?.id || ""),
    title: String(session?.title || "Untitled Session"),
    createdAt: Number(session?.createdAt || Date.now()),
    updatedAt: Number(session?.updatedAt || Date.now()),
    messages: Array.isArray(session?.messages) ? session.messages.map(sanitizeMessage) : []
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const db = await readDb();
    const sessions = cloneSessions(db.chats[req.user.id] || []);
    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body?.sessions) ? req.body.sessions : null;
    if (!incoming) {
      return res.status(400).json({ error: "`sessions` must be an array." });
    }

    const sessions = incoming.map(sanitizeSession).filter((session) => session.id);

    await updateDb((db) => {
      db.chats[req.user.id] = sessions;
    });

    return res.json({
      ok: true,
      sessions
    });
  } catch (error) {
    return next(error);
  }
});

export { router as chatsRouter };
