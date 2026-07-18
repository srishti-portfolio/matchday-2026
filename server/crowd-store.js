/**
 * Real-time crowd levels per stadium gate.
 *
 * The server produces a live-feeling simulated baseline that drifts over time.
 * A judge (or a real sensor integration) can POST their own numbers, stored as
 * overrides and returned until reset - so anyone can feed the app real data and
 * watch the UI respond.
 *
 * To integrate real sensors, replace baselineLevel() with your data source; the
 * override mechanism and response shape stay the same.
 */

/** @type {Map<string, Record<string, number>>} stadiumKey -> { gate: level } */
const overrides = new Map();

/** Memoised baselines, recomputed once per BUCKET_MS rather than per request. */
const cache = new Map(); // `${stadiumKey}:${gate}` -> { bucket, level }
const BUCKET_MS = 3000;

/**
 * FNV-1a with an avalanche finalizer, so single-character gate names
 * ("A" vs "B") still produce well-spread values.
 * @param {string} str
 * @returns {number} 0..1
 */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

function baselineLevel(stadiumKey, gate) {
  const key = `${stadiumKey}:${gate}`;
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const hit = cache.get(key);
  if (hit && hit.bucket === bucket) return hit.level;

  const base = hash(key);
  const minutes = Date.now() / 60000;
  const drift = Math.sin(minutes / 6 + base * 6.28) * 0.12;
  const level = Math.max(6, Math.min(98, Math.round((base * 0.7 + 0.2 + drift) * 100)));

  cache.set(key, { bucket, level });
  return level;
}

/** @param {number} level @returns {{label:string, tone:string, wait:number}} */
function describe(level) {
  const label = level >= 67 ? "Busy" : level >= 34 ? "Moderate" : "Low";
  const tone = level >= 67 ? "live" : level >= 34 ? "amber" : "pitch";
  return { label, tone, wait: Math.max(1, Math.round((level / 100) * 22)) };
}

/**
 * @param {string} stadiumKey
 * @param {string[]} gates
 * @returns {Array<{gate:string, level:number, source:"manual"|"live", label:string, tone:string, wait:number}>}
 */
export function getCrowd(stadiumKey, gates) {
  const set = overrides.get(stadiumKey);
  return gates.map((gate) => {
    const manual = set && Object.prototype.hasOwnProperty.call(set, gate);
    const level = manual ? set[gate] : baselineLevel(stadiumKey, gate);
    return { gate, level, source: manual ? "manual" : "live", ...describe(level) };
  });
}

/**
 * Store judge/sensor-supplied levels. Values are clamped to 0-100.
 * @returns {Record<string, number>} the stadium's current overrides
 */
export function setCrowd(stadiumKey, levels) {
  const current = overrides.get(stadiumKey) || {};
  for (const [gate, raw] of Object.entries(levels || {})) {
    const level = Math.round(Number(raw));
    if (!Number.isNaN(level)) current[gate] = Math.max(0, Math.min(100, level));
  }
  overrides.set(stadiumKey, current);
  return current;
}

/** Drop overrides for a stadium, returning it to the simulated baseline. */
export function resetCrowd(stadiumKey) {
  overrides.delete(stadiumKey);
}
