// Simulated real-time crowd density per entry gate.
// Deterministic seed per gate keeps values stable, a time term makes them drift
// so the display feels live. Replace generateCrowd() with a real sensor/API
// call and keep the same return shape: [{ gate, level, label, wait }].

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295; // 0..1
}

function levelLabel(level) {
  if (level < 34) return { label: "Low", tone: "pitch" };
  if (level < 67) return { label: "Moderate", tone: "amber" };
  return { label: "Busy", tone: "live" };
}

export function generateCrowd(stadiumKey, matchId, gates, tick = 0) {
  return gates.map((gate) => {
    const base = hash(`${stadiumKey}:${matchId}:${gate}`); // 0..1 stable
    // slow drift + gentle wobble
    const drift = Math.sin(tick / 6 + base * 6.28) * 0.12;
    const wobble = Math.sin(tick / 2.3 + base * 12) * 0.05;
    let level = Math.round((base * 0.7 + 0.2 + drift + wobble) * 100);
    level = Math.max(6, Math.min(98, level));
    const { label, tone } = levelLabel(level);
    const wait = Math.max(1, Math.round((level / 100) * 22)); // minutes
    return { gate, level, label, tone, wait };
  });
}

export function recommendGate(crowd) {
  if (!crowd.length) return null;
  return crowd.reduce((best, g) => (g.level < best.level ? g : best), crowd[0]);
}
