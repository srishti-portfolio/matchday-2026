import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { getChatReply, getTranslation, isConfigured, verifyKey } from "./claude.js";
import { getMatches } from "./matches.js";
import { getCrowd, setCrowd, resetCrowd } from "./crowd-store.js";
import { isDbConfigured } from "./db.js";
import {
  createUser,
  authenticate,
  signToken,
  requireAuth,
  getUserById,
  updateUser,
  listAttended,
  addAttended,
} from "./auth.js";

/** Small helper: wraps async handlers so rejections hit the error middleware. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Reject requests when the database isn't configured. */
function requireDb(req, res, next) {
  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "Database not configured. Set DATABASE_URL to enable accounts.",
      code: "no_db",
    });
  }
  next();
}

/** @param {unknown} v @returns {string} trimmed string or "" */
const str = (v) => (typeof v === "string" ? v.trim() : "");

export function createApp() {
  const app = express();

  app.set("trust proxy", 1); // correct client IPs behind Render/Vercel proxies
  app.use(helmet());
  app.use(
    cors({
      // Lock to your deployed frontend in production via CORS_ORIGIN.
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
      credentials: false,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  // Rate limits: strict on auth (credential stuffing), moderate on paid AI calls.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
  const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

  // ---------------------------------------------------------------- health --
  app.get(
    "/api/health",
    wrap(async (req, res) => {
      // `aiConfigured` only means a key is present. `?verify=1` actually calls
      // the API so you can tell a missing key from a rejected one.
      const body = { ok: true, aiConfigured: isConfigured(), dbConfigured: isDbConfigured() };
      if (req.query.verify) {
        const check = await verifyKey();
        body.aiKeyValid = check.valid;
        if (!check.valid) body.aiError = check.error;
      }
      res.json(body);
    })
  );

  // ------------------------------------------------------------------ auth --
  app.post(
    "/api/auth/register",
    authLimiter,
    requireDb,
    wrap(async (req, res) => {
      const name = str(req.body?.name);
      const password = str(req.body?.password);
      const language = str(req.body?.language) || "English";

      if (name.length < 2 || name.length > 60) {
        return res.status(400).json({ error: "Name must be 2-60 characters." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      const result = await createUser({ name, password, language });
      if (!result.ok && result.code === "exists") {
        return res.status(409).json({
          error: "You already have an account with this name. Try signing in instead.",
          code: "exists",
        });
      }
      res.status(201).json({ token: signToken(result.user), user: result.user });
    })
  );

  app.post(
    "/api/auth/login",
    authLimiter,
    requireDb,
    wrap(async (req, res) => {
      const name = str(req.body?.name);
      const password = str(req.body?.password);
      if (!name || !password) {
        return res.status(400).json({ error: "Name and password are required." });
      }

      const result = await authenticate({ name, password });
      // Same message for unknown user and wrong password: no account enumeration.
      if (!result.ok) return res.status(401).json({ error: "Incorrect name or password." });

      res.json({ token: signToken(result.user), user: result.user });
    })
  );

  // --------------------------------------------------------------- profile --
  app.get(
    "/api/profile",
    requireDb,
    requireAuth,
    wrap(async (req, res) => {
      const user = await getUserById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found." });
      res.json({ user, attended: await listAttended(req.user.id) });
    })
  );

  app.patch(
    "/api/profile",
    requireDb,
    requireAuth,
    wrap(async (req, res) => {
      const patch = {};
      if (req.body?.name !== undefined) patch.name = str(req.body.name);
      if (req.body?.language !== undefined) patch.language = str(req.body.language);
      if (req.body?.avatar !== undefined) patch.avatar = req.body.avatar;
      if (req.body?.password) patch.password = str(req.body.password);

      if (patch.name !== undefined && (patch.name.length < 2 || patch.name.length > 60)) {
        return res.status(400).json({ error: "Name must be 2-60 characters." });
      }
      if (patch.password !== undefined && patch.password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      const result = await updateUser(req.user.id, patch);
      if (!result.ok && result.code === "exists") {
        return res.status(409).json({ error: "That name is taken.", code: "exists" });
      }
      res.json({ user: result.user });
    })
  );

  // -------------------------------------------------------------- attended --
  app.get(
    "/api/attended",
    requireDb,
    requireAuth,
    wrap(async (req, res) => {
      res.json({ attended: await listAttended(req.user.id) });
    })
  );

  app.post(
    "/api/attended",
    requireDb,
    requireAuth,
    wrap(async (req, res) => {
      const matchId = str(req.body?.matchId);
      if (!matchId) return res.status(400).json({ error: "matchId is required." });
      const attended = await addAttended(req.user.id, matchId, str(req.body?.seat) || null);
      res.status(201).json({ attended });
    })
  );

  // --------------------------------------------------------------- matches --
  app.get(
    "/api/matches",
    wrap(async (req, res) => {
      res.json(await getMatches());
    })
  );

  // ----------------------------------------------------------------- crowd --
  app.get("/api/crowd/:stadiumKey", (req, res) => {
    const gates = String(req.query.gates || "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 12); // bound the work per request
    const list = gates.length ? gates : ["A", "B", "C", "D"];
    res.json({ stadiumKey: req.params.stadiumKey, gates: getCrowd(req.params.stadiumKey, list) });
  });

  app.post("/api/crowd/:stadiumKey", (req, res) => {
    const levels = req.body?.levels;
    if (!levels || typeof levels !== "object" || Array.isArray(levels)) {
      return res.status(400).json({ error: "Body must include a `levels` object like { A: 40 }." });
    }
    const invalid = Object.values(levels).some((v) => Number.isNaN(Number(v)));
    if (invalid) return res.status(400).json({ error: "Each level must be a number 0-100." });

    res.json({ stadiumKey: req.params.stadiumKey, saved: setCrowd(req.params.stadiumKey, levels) });
  });

  app.delete("/api/crowd/:stadiumKey", (req, res) => {
    resetCrowd(req.params.stadiumKey);
    res.json({ stadiumKey: req.params.stadiumKey, reset: true });
  });

  // -------------------------------------------------------------------- AI --
  app.post(
    "/api/chat",
    aiLimiter,
    wrap(async (req, res) => {
      const { messages = [], language = "English" } = req.body || {};
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "`messages` must be an array." });
      }
      res.json(await getChatReply(messages.slice(-20), str(language) || "English"));
    })
  );

  app.post(
    "/api/translate",
    aiLimiter,
    wrap(async (req, res) => {
      const text = str(req.body?.text);
      if (text.length > 2000) {
        return res.status(400).json({ error: "Text is too long (2000 characters max)." });
      }
      const from = str(req.body?.fromLanguage) || "auto";
      const to = str(req.body?.toLanguage) || "English";
      res.json(await getTranslation(text, from, to));
    })
  );

  // ------------------------------------------------------------- fallbacks --
  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

  // Central error handler: logs detail server-side, returns a safe message.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });

  return app;
}