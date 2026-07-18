import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

const BCRYPT_ROUNDS = 12; // deliberate cost: slow enough to resist brute force
const TOKEN_TTL = "7d";

/** @returns {string} the JWT signing secret. Throws in production if unset. */
function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    return "dev-only-insecure-secret";
  }
  return s;
}

/** @param {string} password @returns {Promise<string>} bcrypt hash */
export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** @param {string} password @param {string} hash @returns {Promise<boolean>} */
export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** @param {{id:number,name:string}} user @returns {string} signed JWT */
export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name }, secret(), { expiresIn: TOKEN_TTL });
}

/** @param {string} token @returns {object|null} payload, or null if invalid/expired */
export function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

/**
 * Express middleware. Requires a valid `Authorization: Bearer <token>` header
 * and attaches `req.user = { id, name }`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing authentication token." });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token." });

  req.user = { id: payload.sub, name: payload.name };
  next();
}

/** Shape a DB row for the client (never leaks password_hash). */
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    avatar: row.avatar ?? null,
  };
}

/**
 * Create a user. Relies on the UNIQUE constraint rather than a check-then-insert,
 * so concurrent signups can't both succeed.
 * @returns {Promise<{ok:boolean, code?:string, user?:object}>}
 */
export async function createUser({ name, password, language }) {
  const hash = await hashPassword(password);
  try {
    const { rows } = await query(
      `INSERT INTO users (name, password_hash, language)
       VALUES ($1, $2, $3)
       RETURNING id, name, language, avatar`,
      [name, hash, language || "English"]
    );
    return { ok: true, user: publicUser(rows[0]) };
  } catch (err) {
    if (err.code === "23505") return { ok: false, code: "exists" }; // unique_violation
    throw err;
  }
}

/** @returns {Promise<{ok:boolean, user?:object}>} */
export async function authenticate({ name, password }) {
  const { rows } = await query(
    `SELECT id, name, password_hash, language, avatar FROM users WHERE name = $1`,
    [name]
  );
  if (!rows.length) return { ok: false };
  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) return { ok: false };
  return { ok: true, user: publicUser(rows[0]) };
}

/** @returns {Promise<object|null>} */
export async function getUserById(id) {
  const { rows } = await query(
    `SELECT id, name, language, avatar FROM users WHERE id = $1`,
    [id]
  );
  return rows.length ? publicUser(rows[0]) : null;
}

/** Patch profile fields. Only whitelisted columns can be written. */
export async function updateUser(id, patch) {
  const sets = [];
  const values = [];
  let i = 1;

  if (patch.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(patch.name);
  }
  if (patch.language !== undefined) {
    sets.push(`language = $${i++}`);
    values.push(patch.language);
  }
  if (patch.avatar !== undefined) {
    sets.push(`avatar = $${i++}`);
    values.push(patch.avatar);
  }
  if (patch.password) {
    sets.push(`password_hash = $${i++}`);
    values.push(await hashPassword(patch.password));
  }
  if (!sets.length) return { ok: true, user: await getUserById(id) };

  values.push(id);
  try {
    const { rows } = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, name, language, avatar`,
      values
    );
    return { ok: true, user: publicUser(rows[0]) };
  } catch (err) {
    if (err.code === "23505") return { ok: false, code: "exists" };
    throw err;
  }
}

/** @returns {Promise<Array<{matchId:string, seat:string|null}>>} */
export async function listAttended(userId) {
  const { rows } = await query(
    `SELECT match_id, seat FROM attended_matches WHERE user_id = $1 ORDER BY attended_at DESC`,
    [userId]
  );
  return rows.map((r) => ({ matchId: r.match_id, seat: r.seat }));
}

/** Idempotent: re-attending the same match just updates the seat. */
export async function addAttended(userId, matchId, seat) {
  await query(
    `INSERT INTO attended_matches (user_id, match_id, seat)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, match_id) DO UPDATE SET seat = EXCLUDED.seat`,
    [userId, matchId, seat ?? null]
  );
  return listAttended(userId);
}
