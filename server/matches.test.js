import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { normaliseMatch, getMatches, clearMatchesCache, MATCHES, flagFor } from "./matches.js";

/** A realistic football-data.org payload fragment. */
const RAW_FINISHED = {
  id: 428001,
  utcDate: "2026-07-14T19:00:00Z",
  status: "FINISHED",
  stage: "SEMI_FINALS",
  venue: "AT&T Stadium",
  homeTeam: { name: "France" },
  awayTeam: { name: "Spain" },
  score: { fullTime: { home: 0, away: 2 }, penalties: { home: null, away: null } },
};

const RAW_SCHEDULED = {
  id: 428002,
  utcDate: "2026-07-15T19:00:00Z",
  status: "TIMED",
  stage: "SEMI_FINALS",
  venue: "Mercedes-Benz Stadium",
  homeTeam: { name: "England" },
  awayTeam: { name: "Argentina" },
  score: { fullTime: { home: null, away: null }, penalties: {} },
};

const RAW_PENS = {
  id: 428003,
  utcDate: "2026-07-07T20:00:00Z",
  status: "FINISHED",
  stage: "LAST_16",
  venue: "AT&T Stadium",
  homeTeam: { name: "Switzerland" },
  awayTeam: { name: "Colombia" },
  score: { fullTime: { home: 0, away: 0 }, penalties: { home: 5, away: 4 } },
};

describe("normaliseMatch", () => {
  it("maps a finished match", () => {
    const m = normaliseMatch(RAW_FINISHED);
    expect(m).toMatchObject({
      id: "428001",
      date: "2026-07-14",
      stage: "Semi-final",
      home: "France",
      away: "Spain",
      score: "0–2",
      status: "final",
      stadium: "att",
    });
    expect(m.homeFlag).toBe("🇫🇷");
  });

  it("maps a scheduled match with no score", () => {
    const m = normaliseMatch(RAW_SCHEDULED);
    expect(m.status).toBe("scheduled");
    expect(m.score).toBeNull();
    expect(m.stadium).toBe("mercedes");
  });

  it("includes penalties in the score when present", () => {
    expect(normaliseMatch(RAW_PENS).score).toBe("0–0 (5–4 pens)");
  });

  it("maps IN_PLAY to live", () => {
    expect(normaliseMatch({ ...RAW_SCHEDULED, status: "IN_PLAY" }).status).toBe("live");
  });

  it("falls back gracefully on an unknown venue", () => {
    expect(normaliseMatch({ ...RAW_FINISHED, venue: "Somewhere Else" }).stadium).toBe("metlife");
  });

  it("handles missing team names", () => {
    const m = normaliseMatch({ ...RAW_SCHEDULED, homeTeam: {}, awayTeam: {} });
    expect(m.home).toBe("TBD");
    expect(m.homeFlag).toBe("🏳️");
  });
});

describe("flagFor", () => {
  it("returns a flag for a known team", () => {
    expect(flagFor("Spain")).toBe("🇪🇸");
  });
  it("returns a neutral flag otherwise", () => {
    expect(flagFor("Atlantis")).toBe("🏳️");
  });
});

describe("getMatches", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearMatchesCache();
    delete process.env.LIVE_FOOTBALL_API_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.LIVE_FOOTBALL_API_KEY;
    clearMatchesCache();
  });

  it("serves the bundled snapshot when no key is configured", async () => {
    const res = await getMatches();
    expect(res.source).toBe("snapshot");
    expect(res.matches).toBe(MATCHES);
    expect(res.snapshotTaken).toBeTruthy(); // the UI shows this honestly
  });

  it("serves live data when the feed is configured", async () => {
    process.env.LIVE_FOOTBALL_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ matches: [RAW_FINISHED, RAW_SCHEDULED] }),
    }));

    const res = await getMatches();
    expect(res.source).toBe("live");
    expect(res.matches).toHaveLength(2);
    expect(res.matches[0].home).toBe("France");
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("sends the provider auth header", async () => {
    process.env.LIVE_FOOTBALL_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ matches: [RAW_FINISHED] }) }));
    await getMatches();
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers["X-Auth-Token"]).toBe("test-key");
  });

  it("falls back to the snapshot when the feed errors", async () => {
    process.env.LIVE_FOOTBALL_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));

    const res = await getMatches();
    expect(res.source).toBe("snapshot"); // never breaks the app
  });

  it("falls back when the network throws", async () => {
    process.env.LIVE_FOOTBALL_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    expect((await getMatches()).source).toBe("snapshot");
  });

  it("caches responses so the provider isn't hammered", async () => {
    process.env.LIVE_FOOTBALL_API_KEY = "test-key";
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ matches: [RAW_FINISHED] }) }));

    await getMatches();
    await getMatches();
    await getMatches();
    expect(globalThis.fetch).toHaveBeenCalledOnce(); // 3 calls, 1 fetch
  });
});

describe("bundled snapshot integrity", () => {
  it("has unique ids", () => {
    const ids = MATCHES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every finished match a score, and none to scheduled ones", () => {
    for (const m of MATCHES) {
      if (m.status === "final") expect(m.score, `${m.id} needs a score`).toBeTruthy();
      if (m.status === "scheduled") expect(m.score, `${m.id} should have no score`).toBeNull();
    }
  });

  it("uses ISO dates", () => {
    for (const m of MATCHES) expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
