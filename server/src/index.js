import "dotenv/config";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRouter } from "./routes/auth.js";
import { chatRoute } from "./routes/chat.js";
import { chatsRouter } from "./routes/chats.js";
import { requireAuth } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, "..", "..", "client", "dist");
const app = express();
const port = Number(process.env.PORT || 8787);
const host = "0.0.0.0";

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "my-gpt-server",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRouter);
app.use("/api/chats", chatsRouter);
app.post("/api/chat", requireAuth, chatRoute);

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  const statusCode = Number(error?.statusCode || 500);
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  res.status(statusCode).json({ error: message });
});

app.listen(port, host, () => {
  console.log(`my-gpt-server listening on http://${host}:${port}`);
});
