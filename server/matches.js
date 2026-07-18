/**
 * Match fixtures + scores, served by GET /api/matches.
 *
 * Two modes:
 *  - LIVE:     set LIVE_FOOTBALL_API_KEY (football-data.org) and every request
 *              pulls real fixtures/scores/statuses, cached briefly.
 *  - SNAPSHOT: without a key, the bundled snapshot below is served so the app
 *              always works offline. It is accurate as of the date in SNAPSHOT_TAKEN
 *              but does NOT update - configure the live feed for a real deployment.
 */

export const SNAPSHOT_TAKEN = "2026-07-17";

/** Stadium keys used by the UI, keyed by the venue a match is played at. */
const TEAM_FLAGS = {
  Argentina: "🇦🇷",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Colombia: "🇨🇴",
  Egypt: "🇪🇬",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  France: "🇫🇷",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Norway: "🇳🇴",
  Portugal: "🇵🇹",
  Spain: "🇪🇸",
  Switzerland: "🇨🇭",
  USA: "🇺🇸",
};

/** @param {string} name @returns {string} flag emoji, or a neutral placeholder */
export function flagFor(name) {
  return TEAM_FLAGS[name] || "🏳️";
}

export const MATCHES = [
  // --- Round of 16 (completed) ---
  { id: "r16-1", date: "2026-07-05", time: "16:00", stage: "Round of 16", home: "Brazil", away: "Norway", homeFlag: "🇧🇷", awayFlag: "🇳🇴", stadium: "lincoln", score: "1–2", status: "final" },
  { id: "r16-2", date: "2026-07-05", time: "21:00", stage: "Round of 16", home: "Mexico", away: "England", homeFlag: "🇲🇽", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stadium: "azteca", score: "2–3", status: "final" },
  { id: "r16-3", date: "2026-07-06", time: "15:00", stage: "Round of 16", home: "Portugal", away: "Spain", homeFlag: "🇵🇹", awayFlag: "🇪🇸", stadium: "metlife", score: "0–1", status: "final" },
  { id: "r16-4", date: "2026-07-06", time: "20:00", stage: "Round of 16", home: "USA", away: "Belgium", homeFlag: "🇺🇸", awayFlag: "🇧🇪", stadium: "sofi", score: "1–4", status: "final" },
  { id: "r16-5", date: "2026-07-07", time: "16:00", stage: "Round of 16", home: "Argentina", away: "Egypt", homeFlag: "🇦🇷", awayFlag: "🇪🇬", stadium: "hardrock", score: "3–2", status: "final" },
  { id: "r16-6", date: "2026-07-07", time: "20:00", stage: "Round of 16", home: "Switzerland", away: "Colombia", homeFlag: "🇨🇭", awayFlag: "🇨🇴", stadium: "att", score: "0–0 (5–4 pens)", status: "final" },

  // --- Quarter-finals (completed) ---
  { id: "qf-1", date: "2026-07-09", time: "16:00", stage: "Quarter-final", home: "France", away: "Morocco", homeFlag: "🇫🇷", awayFlag: "🇲🇦", stadium: "gillette", score: "2–0", status: "final" },
  { id: "qf-2", date: "2026-07-10", time: "15:00", stage: "Quarter-final", home: "Spain", away: "Belgium", homeFlag: "🇪🇸", awayFlag: "🇧🇪", stadium: "levis", score: "2–1", status: "final" },
  { id: "qf-3", date: "2026-07-11", time: "17:00", stage: "Quarter-final", home: "Norway", away: "England", homeFlag: "🇳🇴", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stadium: "arrowhead", score: "1–2", status: "final" },
  { id: "qf-4", date: "2026-07-11", time: "21:00", stage: "Quarter-final", home: "Argentina", away: "Switzerland", homeFlag: "🇦🇷", awayFlag: "🇨🇭", stadium: "nrg", score: "3–1", status: "final" },

  // --- Semi-finals ---
  { id: "sf-1", date: "2026-07-14", time: "15:00", stage: "Semi-final", home: "France", away: "Spain", homeFlag: "🇫🇷", awayFlag: "🇪🇸", stadium: "att", score: "0–2", status: "final" },
  { id: "sf-2", date: "2026-07-15", time: "15:00", stage: "Semi-final", home: "England", away: "Argentina", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayFlag: "🇦🇷", stadium: "mercedes", score: "1–2", status: "final" },

  // --- Final rounds ---
  { id: "tpp", date: "2026-07-18", time: "17:00", stage: "Third place", home: "France", away: "England", homeFlag: "🇫🇷", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stadium: "hardrock", score: null, status: "scheduled", winProb: { home: 50.1, draw: 24.1, away: 25.8 } },
  { id: "final", date: "2026-07-19", time: "15:00", stage: "Final", home: "Spain", away: "Argentina", homeFlag: "🇪🇸", awayFlag: "🇦🇷", stadium: "metlife", score: null, status: "scheduled", winProb: { home: 41.4, draw: 31.3, away: 27.3 } },
];

/* -------------------------------------------------------------------------- */
/*                             live feed integration                          */
/* -------------------------------------------------------------------------- */

const FEED_URL =
  process.env.LIVE_FOOTBALL_API_URL || "https://api.football-data.org/v4/competitions/WC/matches";

/** Which of our stadium keys a venue name maps to. Extend as needed. */
const VENUE_TO_KEY = {
  "MetLife Stadium": "metlife",
  "SoFi Stadium": "sofi",
  "AT&T Stadium": "att",
  "Mercedes-Benz Stadium": "mercedes",
  "Hard Rock Stadium": "hardrock",
  "NRG Stadium": "nrg",
  "Arrowhead Stadium": "arrowhead",
  "Lincoln Financial Field": "lincoln",
  "Levi's Stadium": "levis",
  "Lumen Field": "lumen",
  "Gillette Stadium": "gillette",
  "BMO Field": "bmo",
  "BC Place": "bcplace",
  "Estadio Azteca": "azteca",
  "Estadio Akron": "akron",
  "Estadio BBVA": "bbva",
};

/** football-data.org status -> ours. */
const STATUS_MAP = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "final",
  POSTPONED: "scheduled",
  SUSPENDED: "scheduled",
  CANCELLED: "scheduled",
};

/** Prettify "SEMI_FINALS" -> "Semi-final". */
function stageLabel(stage) {
  const map = {
    GROUP_STAGE: "Group stage",
    LAST_16: "Round of 16",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-final",
    SEMI_FINALS: "Semi-final",
    THIRD_PLACE: "Third place",
    FINAL: "Final",
  };
  return map[stage] || String(stage || "").replace(/_/g, " ");
}

/**
 * Convert one provider match into our shape.
 * @param {object} m raw football-data.org match
 * @returns {object} normalised match
 */
export function normaliseMatch(m) {
  const kickoff = new Date(m.utcDate);
  const home = m.homeTeam?.name || "TBD";
  const away = m.awayTeam?.name || "TBD";
  const ft = m.score?.fullTime || {};
  const pens = m.score?.penalties || {};

  let score = null;
  if (ft.home !== null && ft.home !== undefined && ft.away !== null && ft.away !== undefined) {
    score = `${ft.home}–${ft.away}`;
    if (pens.home !== null && pens.home !== undefined && pens.away !== null && pens.away !== undefined) {
      score += ` (${pens.home}–${pens.away} pens)`;
    }
  }

  return {
    id: String(m.id),
    date: kickoff.toISOString().slice(0, 10),
    time: kickoff.toISOString().slice(11, 16),
    stage: stageLabel(m.stage),
    home,
    away,
    homeFlag: flagFor(home),
    awayFlag: flagFor(away),
    stadium: VENUE_TO_KEY[m.venue] || "metlife",
    score,
    status: STATUS_MAP[m.status] || "scheduled",
  };
}

/**
 * Fetch fixtures from the live provider.
 * @returns {Promise<object[]|null>} normalised matches, or null if unconfigured
 */
async function fetchLiveMatches() {
  const key = process.env.LIVE_FOOTBALL_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // never hang a request
  try {
    const res = await fetch(FEED_URL, {
      headers: { "X-Auth-Token": key },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`live feed responded ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.matches) || !data.matches.length) return null;
    return data.matches.map(normaliseMatch);
  } finally {
    clearTimeout(timeout);
  }
}

/** Short cache so a burst of clients doesn't hammer the provider's rate limit. */
let cache = { at: 0, payload: null };
const CACHE_MS = 30000;

/**
 * @returns {Promise<{source:"live"|"snapshot", matches:object[], snapshotTaken?:string}>}
 */
export async function getMatches() {
  if (cache.payload && Date.now() - cache.at < CACHE_MS) return cache.payload;

  let payload;
  try {
    const live = await fetchLiveMatches();
    payload = live
      ? { source: "live", matches: live }
      : { source: "snapshot", matches: MATCHES, snapshotTaken: SNAPSHOT_TAKEN };
  } catch (err) {
    console.warn("live matches fetch failed, serving snapshot:", err.message);
    payload = { source: "snapshot", matches: MATCHES, snapshotTaken: SNAPSHOT_TAKEN };
  }

  cache = { at: Date.now(), payload };
  return payload;
}

/** Exposed for tests. */
export function clearMatchesCache() {
  cache = { at: 0, payload: null };
}