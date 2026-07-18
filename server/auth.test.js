import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the database so these tests need no Neon connection.
const mockQuery = vi.fn();
vi.mock("./db.js", () => ({
  query: (...args) => mockQuery(...args),
  isDbConfigured: () => true,
}));

import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  requireAuth,
  createUser,
  authenticate,
} from "./auth.js";

beforeEach(() => {
  mockQuery.mockReset();
  process.env.JWT_SECRET = "test-secret";
});
afterEach(() => {
  delete process.env.JWT_SECRET;
});

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("worldcup2026");
    expect(hash).not.toBe("worldcup2026"); // never stored in plain text
    expect(await verifyPassword("worldcup2026", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-horse", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
});

describe("tokens", () => {
  it("round-trips a signed token", () => {
    const token = signToken({ id: 7, name: "Alex" });
    const payload = verifyToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.name).toBe("Alex");
  });

  it("rejects a tampered token", () => {
    expect(verifyToken("not.a.token")).toBeNull();
  });
});

describe("requireAuth middleware", () => {
  function mockRes() {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
  }

  it("401s without a token", () => {
    const res = mockRes();
    const next = vi.fn();
    requireAuth({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s on an invalid token", () => {
    const res = mockRes();
    const next = vi.fn();
    requireAuth({ headers: { authorization: "Bearer garbage" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the user and continues on a valid token", () => {
    const token = signToken({ id: 3, name: "Sam" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 3, name: "Sam" });
  });
});

describe("createUser", () => {
  it("returns the new user without the password hash", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Alex", language: "Spanish", avatar: null }],
    });
    const res = await createUser({ name: "Alex", password: "secret123", language: "Spanish" });
    expect(res.ok).toBe(true);
    expect(res.user).toEqual({ id: 1, name: "Alex", language: "Spanish", avatar: null });
    expect(res.user.password_hash).toBeUndefined();
  });

  it("reports a duplicate name via the unique constraint", async () => {
    mockQuery.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505" }));
    const res = await createUser({ name: "Alex", password: "secret123" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe("exists");
  });
});

describe("authenticate", () => {
  it("fails for an unknown user", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    expect((await authenticate({ name: "ghost", password: "x" })).ok).toBe(false);
  });

  it("succeeds with the right password", async () => {
    const hash = await hashPassword("letmein123");
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, name: "Sam", password_hash: hash, language: "English", avatar: null }],
    });
    const res = await authenticate({ name: "Sam", password: "letmein123" });
    expect(res.ok).toBe(true);
    expect(res.user.name).toBe("Sam");
  });

  it("fails with the wrong password", async () => {
    const hash = await hashPassword("letmein123");
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, name: "Sam", password_hash: hash, language: "English", avatar: null }],
    });
    expect((await authenticate({ name: "Sam", password: "nope" })).ok).toBe(false);
  });
});
