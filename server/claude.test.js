import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the Anthropic SDK so tests are deterministic and need no key or network.
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

import { isConfigured, getChatReply, getTranslation } from "./claude.js";

const KEY = "ANTHROPIC_API_KEY";

describe("isConfigured", () => {
  afterEach(() => delete process.env[KEY]);

  it("is false when no key is set", () => {
    delete process.env[KEY];
    expect(isConfigured()).toBe(false);
  });

  it("is true when a key is set", () => {
    process.env[KEY] = "sk-test";
    expect(isConfigured()).toBe(true);
  });
});

describe("without an API key", () => {
  beforeEach(() => delete process.env[KEY]);

  it("chat returns a graceful not-connected response", async () => {
    const r = await getChatReply([{ role: "user", content: "hi" }], "English");
    expect(r.configured).toBe(false);
    expect(typeof r.reply).toBe("string");
    expect(r.reply.length).toBeGreaterThan(0);
  });

  it("translate returns a graceful not-connected response", async () => {
    const r = await getTranslation("hola", "Spanish", "English");
    expect(r.configured).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe("with an API key (mocked SDK)", () => {
  beforeEach(() => (process.env[KEY] = "sk-test"));
  afterEach(() => delete process.env[KEY]);

  it("chat returns the model text", async () => {
    const r = await getChatReply([{ role: "user", content: "hi" }], "English");
    expect(r.configured).toBe(true);
    expect(r.reply).toBe("MOCKED OUTPUT");
  });

  it("translate returns the model text", async () => {
    const r = await getTranslation("hola", "Spanish", "English");
    expect(r.configured).toBe(true);
    expect(r.translation).toBe("MOCKED OUTPUT");
  });

  it("translate short-circuits on empty input", async () => {
    const r = await getTranslation("   ", "Spanish", "English");
    expect(r.translation).toBe("");
  });
});
