import { describe, it, expect } from "vitest";
import { generateCrowd, recommendGate } from "./crowd.js";

describe("generateCrowd", () => {
  const gates = ["A", "B", "C", "D"];

  it("returns one entry per gate with sane fields", () => {
    const crowd = generateCrowd("metlife", "m1", gates, 0);
    expect(crowd).toHaveLength(4);
    for (const g of crowd) {
      expect(g.level).toBeGreaterThanOrEqual(6);
      expect(g.level).toBeLessThanOrEqual(98);
      expect(g.wait).toBeGreaterThanOrEqual(1);
      expect(["Low", "Moderate", "Busy"]).toContain(g.label);
    }
  });

  it("is deterministic for identical inputs", () => {
    const a = generateCrowd("sofi", "x", gates, 3);
    const b = generateCrowd("sofi", "x", gates, 3);
    expect(a).toEqual(b);
  });
});

describe("recommendGate", () => {
  it("picks the lowest-level gate", () => {
    const crowd = [
      { gate: "A", level: 80 },
      { gate: "B", level: 20 },
      { gate: "C", level: 50 },
    ];
    expect(recommendGate(crowd).gate).toBe("B");
  });
});
