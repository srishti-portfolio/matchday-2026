import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

/**
 * Exercises the real database code path (routes -> auth.js -> SQL) against an
 * in-memory fake of db.js, so the full register/login/profile/attended flow is
 * verified without needing a live Neon connection.
 */

const users = [];
const attended = [];
let nextId = 1;

/** Minimal Postgres stand-in: understands only the queries auth.js issues. */
function fakeQuery(text, params = []) {
  const sql = text.replace(/\s+/g, " ").trim();

  if (sql.startsWith("INSERT INTO users")) {
    const [name, hash, language] = params;
    if (users.some((u) => u.name === name)) {
      return Promise.reject(Object.assign(new Error("duplicate key"), { code: "23505" }));
    }
    const row = { id: nextId++, name, password_hash: hash, language, avatar: null };
    users.push(row);
    return Promise.resolve({ rows: [{ ...row }] });
  }

  if (sql.startsWith("SELECT id, name, password_hash")) {
    const row = users.find((u) => u.name === params[0]);
    return Promise.resolve({ rows: row ? [{ ...row }] : [] });
  }

  if (sql.startsWith("SELECT id, name, language, avatar FROM users WHERE id")) {
    const row = users.find((u) => u.id === Number(params[0]));
    return Promise.resolve({ rows: row ? [{ ...row }] : [] });
  }

  if (sql.startsWith("UPDATE users SET")) {
    const id = Number(params[params.length - 1]);
    const row = users.find((u) => u.id === id);
    if (!row) return Promise.resolve({ rows: [] });
    if (sql.includes("name = $1")) {
      if (users.some((u) => u.name === params[0] && u.id !== id)) {
        return Promise.reject(Object.assign(new Error("duplicate key"), { code: "23505" }));
      }
      row.name = params[0];
    }
    if (sql.includes("language =")) {
      const idx = sql.includes("name = $1") ? 1 : 0;
      row.language = params[idx];
    }
    return Promise.resolve({ rows: [{ ...row }] });
  }

  if (sql.startsWith("INSERT INTO attended_matches")) {
    const [userId, matchId, seat] = params;
    const existing = attended.find((a) => a.user_id === userId && a.match_id === matchId);
    if (existing) existing.seat = seat;
    else attended.push({ user_id: Number(userId), match_id: matchId, seat });
    return Promise.resolve({ rows: [] });
  }

  if (sql.startsWith("SELECT match_id, seat FROM attended_matches")) {
    const rows = attended
      .filter((a) => a.user_id === Number(params[0]))
      .map((a) => ({ match_id: a.match_id, seat: a.seat }));
    return Promise.resolve({ rows });
  }

  return Promise.resolve({ rows: [] });
}

vi.mock("./db.js", () => ({
  query: (text, params) => fakeQuery(text, params),
  isDbConfigured: () => true,
  initDb: async () => true,
  getPool: () => ({}),
  closeDb: async () => {},
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    constructor() {
      this.messages = { create: vi.fn(async () => ({ content: [{ type: "text", text: "ok" }] })) };
    }
  },
}));

const { createApp } = await import("./app.js");

let app;
beforeEach(() => {
  users.length = 0;
  attended.length = 0;
  nextId = 1;
  process.env.JWT_SECRET = "test-secret";
  app = createApp();
});

describe("register", () => {
  it("creates an account and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alex", password: "secret123", language: "Spanish" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ name: "Alex", language: "Spanish" });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("409s when the name already exists", async () => {
    await request(app).post("/api/auth/register").send({ name: "Alex", password: "secret123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alex", password: "another1" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("exists");
    expect(res.body.error).toMatch(/already have an account/i);
  });

  it("rejects a short password", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Alex", password: "123" });
    expect(res.status).toBe(400);
  });

  it("rejects a short name", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "A", password: "secret123" });
    expect(res.status).toBe(400);
  });

  it("stores the password hashed, never in plain text", async () => {
    await request(app).post("/api/auth/register").send({ name: "Alex", password: "secret123" });
    expect(users[0].password_hash).not.toBe("secret123");
    expect(users[0].password_hash.startsWith("$2")).toBe(true); // bcrypt
  });
});

describe("login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({ name: "Alex", password: "secret123" });
  });

  it("succeeds with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ name: "Alex", password: "secret123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("401s on a wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ name: "Alex", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("gives the same error for unknown users (no account enumeration)", async () => {
    const unknown = await request(app).post("/api/auth/login").send({ name: "Ghost", password: "x" });
    const wrongPw = await request(app).post("/api/auth/login").send({ name: "Alex", password: "x" });
    expect(unknown.body.error).toBe(wrongPw.body.error);
  });
});

describe("profile + attended (authenticated)", () => {
  let token;
  beforeEach(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alex", password: "secret123", language: "Spanish" });
    token = res.body.token;
  });

  it("401s without a token", async () => {
    expect((await request(app).get("/api/profile")).status).toBe(401);
  });

  it("returns the profile with a valid token", async () => {
    const res = await request(app).get("/api/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Alex");
    expect(res.body.attended).toEqual([]);
  });

  it("updates the language", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ language: "French" });
    expect(res.status).toBe(200);
    expect(res.body.user.language).toBe("French");
  });

  it("records an attended match and lists it back", async () => {
    const post = await request(app)
      .post("/api/attended")
      .set("Authorization", `Bearer ${token}`)
      .send({ matchId: "sf-1", seat: "Sec 114" });
    expect(post.status).toBe(201);

    const list = await request(app).get("/api/attended").set("Authorization", `Bearer ${token}`);
    expect(list.body.attended).toEqual([{ matchId: "sf-1", seat: "Sec 114" }]);
  });

  it("attending the same match twice does not duplicate it", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    await request(app).post("/api/attended").set(auth).send({ matchId: "sf-1", seat: "A" });
    await request(app).post("/api/attended").set(auth).send({ matchId: "sf-1", seat: "B" });
    const list = await request(app).get("/api/attended").set(auth);
    expect(list.body.attended).toHaveLength(1);
    expect(list.body.attended[0].seat).toBe("B"); // seat updated
  });

  it("requires matchId", async () => {
    const res = await request(app)
      .post("/api/attended")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
