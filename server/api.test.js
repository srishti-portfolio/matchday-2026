import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

// Mock the SDK so the routes return deterministic content.
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    constructor() {
      this.messages = {
        create: vi.fn(async () => ({
          content: [{ type: "text", text: "MOCKED OUTPUT" }],
        })),
      };
    }
  },
}));

import { createApp } from "./app.js";

let app;
beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = "sk-test";
  app = createApp();
});

describe("GET /api/health", () => {
  it("reports ok and whether AI is configured", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.aiConfigured).toBe(true);
  });
});

describe("POST /api/chat", () => {
  it("returns an assistant reply", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "hi" }], language: "English" });
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.reply).toBe("MOCKED OUTPUT");
  });

  it("handles an empty body without crashing", async () => {
    const res = await request(app).post("/api/chat").send({});
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe("string");
  });
});

describe("POST /api/translate", () => {
  it("returns a translation", async () => {
    const res = await request(app)
      .post("/api/translate")
      .send({ text: "hola", fromLanguage: "Spanish", toLanguage: "English" });
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.translation).toBe("MOCKED OUTPUT");
  });
});

describe("GET /api/matches", () => {
  it("returns fixtures with a source label", async () => {
    const res = await request(app).get("/api/matches");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBeGreaterThan(0);
    expect(["snapshot", "live"]).toContain(res.body.source);
  });
});

describe("crowd endpoints", () => {
  it("GET returns a level per requested gate", async () => {
    const res = await request(app).get("/api/crowd/metlife?gates=A,B,C");
    expect(res.status).toBe(200);
    expect(res.body.gates).toHaveLength(3);
    for (const g of res.body.gates) {
      expect(g.level).toBeGreaterThanOrEqual(0);
      expect(g.level).toBeLessThanOrEqual(100);
    }
  });

  it("POST stores judge input and GET reflects it as manual", async () => {
    await request(app).post("/api/crowd/att").send({ levels: { A: 12, B: 88 } });
    const res = await request(app).get("/api/crowd/att?gates=A,B");
    const a = res.body.gates.find((g) => g.gate === "A");
    const b = res.body.gates.find((g) => g.gate === "B");
    expect(a.level).toBe(12);
    expect(a.source).toBe("manual");
    expect(b.level).toBe(88);
  });

  it("POST without a levels object is rejected", async () => {
    const res = await request(app).post("/api/crowd/att").send({});
    expect(res.status).toBe(400);
  });
});

describe("auth endpoints without a database", () => {
  it("register returns 503 with a clear code", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alex", password: "secret123" });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("no_db");
  });

  it("login returns 503", async () => {
    const res = await request(app).post("/api/auth/login").send({ name: "Alex", password: "x" });
    expect(res.status).toBe(503);
  });

  it("health reports dbConfigured false", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.dbConfigured).toBe(false);
  });
});

describe("validation + errors", () => {
  it("unknown API routes 404 as JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });

  it("chat rejects a non-array messages field", async () => {
    const res = await request(app).post("/api/chat").send({ messages: "nope" });
    expect(res.status).toBe(400);
  });

  it("translate rejects overly long text", async () => {
    const res = await request(app)
      .post("/api/translate")
      .send({ text: "x".repeat(2001), toLanguage: "English" });
    expect(res.status).toBe(400);
  });

  it("crowd POST rejects non-numeric levels", async () => {
    const res = await request(app).post("/api/crowd/att").send({ levels: { A: "loads" } });
    expect(res.status).toBe(400);
  });
});
