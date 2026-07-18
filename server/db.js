import pg from "pg";

/**
 * Neon serverless Postgres.
 *
 * Set DATABASE_URL in server/.env, e.g.
 *   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
 *
 * Without it the server still boots: auth endpoints report that the database
 * isn't configured and the client falls back to local demo accounts, while
 * matches, crowd data and the AI endpoints keep working.
 */

const { Pool } = pg;

let pool = null;

/** @returns {boolean} true when a DATABASE_URL is present. */
export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/** @returns {import("pg").Pool | null} lazily-created pool, or null if unconfigured. */
export function getPool() {
  if (!isDbConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Neon requires SSL
      max: 5, // small pool: friendly to serverless hosts
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => console.error("Unexpected pg pool error:", err));
  }
  return pool;
}

/**
 * Run a parameterised query. Always pass values via `params` (never string
 * concatenation) so Postgres handles escaping and SQL injection is impossible.
 * @param {string} text SQL with $1, $2 placeholders
 * @param {unknown[]} [params]
 */
export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not set");
  return p.query(text, params);
}

// Idempotent schema - safe to run on every boot.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'English',
  avatar        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attended_matches (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id    TEXT NOT NULL,
  seat        TEXT,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_attended_user ON attended_matches(user_id);
`;

/** Create tables if needed. @returns {Promise<boolean>} whether the DB is live. */
export async function initDb() {
  if (!isDbConfigured()) {
    console.warn("DATABASE_URL not set - running in demo mode (local accounts).");
    return false;
  }
  await query(SCHEMA);
  console.log("Database ready (users, attended_matches).");
  return true;
}

/** Close the pool (used by tests and graceful shutdown). */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
