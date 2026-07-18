// -----------------------------------------------------------------------------
// Matchday data layer
// -----------------------------------------------------------------------------
// All schedule / crowd / transit content here is seeded so the app works fully
// offline for a demo. Each object is shaped so you can later swap in a live
// data source (a fixtures API, a transit API, a real crowd-sensor feed) without
// touching the UI. Coordinates and FIFA venue facts are real.
// -----------------------------------------------------------------------------

export const HOST_COUNTRY_LANGUAGE = {
  USA: "English",
  Canada: "English",
  Mexico: "Spanish",
};

// Languages offered at sign-up and in the translator.
export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
];

// -----------------------------------------------------------------------------
// Host stadiums (16). transitLines + gates are illustrative but realistic.
// -----------------------------------------------------------------------------
export const STADIUMS = [
  {
    key: "metlife",
    name: "MetLife Stadium",
    fifaName: "New York New Jersey Stadium",
    city: "East Rutherford, NJ",
    country: "USA",
    capacity: 82500,
    lat: 40.8135,
    lng: -74.0745,
    transitLines: [
      { type: "Rail", name: "Meadowlands Rail Line", from: "Secaucus Junction", color: "#4C86FF" },
      { type: "Bus", name: "Coach USA 351", from: "Port Authority, NYC", color: "#FFB020" },
    ],
    gates: ["A", "B", "C", "D"],
  },
  {
    key: "sofi",
    name: "SoFi Stadium",
    fifaName: "Los Angeles Stadium",
    city: "Inglewood, CA",
    country: "USA",
    capacity: 70000,
    lat: 33.9535,
    lng: -118.3392,
    transitLines: [
      { type: "Metro", name: "K Line", from: "Downtown LA", color: "#2DD36F" },
      { type: "Shuttle", name: "SoFi Shuttle", from: "Hawthorne/Lennox Station", color: "#4C86FF" },
    ],
    gates: ["Entry 1", "Entry 3", "Entry 5", "Entry 7"],
  },
  {
    key: "att",
    name: "AT&T Stadium",
    fifaName: "Dallas Stadium",
    city: "Arlington, TX",
    country: "USA",
    capacity: 80000,
    lat: 32.7473,
    lng: -97.0945,
    transitLines: [
      { type: "Bus", name: "Arlington Trolley", from: "Downtown Arlington", color: "#FFB020" },
      { type: "Rail", name: "TRE + Shuttle", from: "CentrePort Station", color: "#4C86FF" },
    ],
    gates: ["A", "C", "E", "G"],
  },
  {
    key: "mercedes",
    name: "Mercedes-Benz Stadium",
    fifaName: "Atlanta Stadium",
    city: "Atlanta, GA",
    country: "USA",
    capacity: 71000,
    lat: 33.7554,
    lng: -84.4009,
    transitLines: [
      { type: "Metro", name: "MARTA Blue/Green", from: "GWCC / CNN Center", color: "#2DD36F" },
      { type: "Metro", name: "MARTA Red/Gold", from: "Five Points", color: "#FF3B6B" },
    ],
    gates: ["1", "2", "3", "5"],
  },
  {
    key: "hardrock",
    name: "Hard Rock Stadium",
    fifaName: "Miami Stadium",
    city: "Miami Gardens, FL",
    country: "USA",
    capacity: 65000,
    lat: 25.958,
    lng: -80.2389,
    transitLines: [
      { type: "Shuttle", name: "Miami Gardens Express", from: "Golden Glades Station", color: "#4C86FF" },
      { type: "Bus", name: "Metrobus 27", from: "Downtown Miami", color: "#FFB020" },
    ],
    gates: ["A", "D", "F", "H"],
  },
  {
    key: "nrg",
    name: "NRG Stadium",
    fifaName: "Houston Stadium",
    city: "Houston, TX",
    country: "USA",
    capacity: 72000,
    lat: 29.6847,
    lng: -95.4107,
    transitLines: [
      { type: "Metro", name: "METRORail Red Line", from: "Downtown Houston", color: "#FF3B6B" },
      { type: "Bus", name: "Route 8 Kirby", from: "Midtown", color: "#FFB020" },
    ],
    gates: ["A", "B", "C", "D"],
  },
  {
    key: "arrowhead",
    name: "Arrowhead Stadium",
    fifaName: "Kansas City Stadium",
    city: "Kansas City, MO",
    country: "USA",
    capacity: 76000,
    lat: 39.0489,
    lng: -94.4839,
    transitLines: [
      { type: "Bus", name: "RideKC Game Day", from: "Downtown KC", color: "#FFB020" },
      { type: "Shuttle", name: "Truman Sports Shuttle", from: "Park & Ride", color: "#4C86FF" },
    ],
    gates: ["1", "2", "4", "6"],
  },
  {
    key: "lincoln",
    name: "Lincoln Financial Field",
    fifaName: "Philadelphia Stadium",
    city: "Philadelphia, PA",
    country: "USA",
    capacity: 69000,
    lat: 39.9008,
    lng: -75.1675,
    transitLines: [
      { type: "Metro", name: "SEPTA Broad St Line", from: "City Hall", color: "#FF3B6B" },
      { type: "Bus", name: "Route 17", from: "Center City", color: "#FFB020" },
    ],
    gates: ["A", "E", "J", "K"],
  },
  {
    key: "levis",
    name: "Levi's Stadium",
    fifaName: "San Francisco Bay Area Stadium",
    city: "Santa Clara, CA",
    country: "USA",
    capacity: 71000,
    lat: 37.403,
    lng: -121.9698,
    transitLines: [
      { type: "Rail", name: "VTA Light Rail", from: "Mountain View", color: "#2DD36F" },
      { type: "Rail", name: "Caltrain + Shuttle", from: "Mountain View Station", color: "#4C86FF" },
    ],
    gates: ["A", "B", "C", "F"],
  },
  {
    key: "lumen",
    name: "Lumen Field",
    fifaName: "Seattle Stadium",
    city: "Seattle, WA",
    country: "USA",
    capacity: 69000,
    lat: 47.5952,
    lng: -122.3316,
    transitLines: [
      { type: "Metro", name: "Link Light Rail", from: "Westlake / SeaTac", color: "#2DD36F" },
      { type: "Rail", name: "Sounder Train", from: "Tacoma / Everett", color: "#4C86FF" },
    ],
    gates: ["North", "South", "East", "West"],
  },
  {
    key: "gillette",
    name: "Gillette Stadium",
    fifaName: "Boston Stadium",
    city: "Foxborough, MA",
    country: "USA",
    capacity: 65000,
    lat: 42.0909,
    lng: -71.2643,
    transitLines: [
      { type: "Rail", name: "MBTA Special Event Train", from: "South Station, Boston", color: "#FF3B6B" },
      { type: "Bus", name: "Gillette Express Coach", from: "Downtown Boston", color: "#FFB020" },
    ],
    gates: ["A", "B", "C", "D"],
  },
  {
    key: "bmo",
    name: "BMO Field",
    fifaName: "Toronto Stadium",
    city: "Toronto, ON",
    country: "Canada",
    capacity: 45000,
    lat: 43.6332,
    lng: -79.4185,
    transitLines: [
      { type: "Rail", name: "GO Transit (Exhibition)", from: "Union Station", color: "#4C86FF" },
      { type: "Streetcar", name: "509 Harbourfront", from: "Union Station", color: "#2DD36F" },
    ],
    gates: ["1", "3", "5", "7"],
  },
  {
    key: "bcplace",
    name: "BC Place",
    fifaName: "Vancouver Stadium",
    city: "Vancouver, BC",
    country: "Canada",
    capacity: 54000,
    lat: 49.2768,
    lng: -123.112,
    transitLines: [
      { type: "Metro", name: "SkyTrain Expo Line", from: "Stadium–Chinatown", color: "#2DD36F" },
      { type: "Metro", name: "Canada Line", from: "YVR Airport", color: "#4C86FF" },
    ],
    gates: ["A", "B", "C", "H"],
  },
  {
    key: "azteca",
    name: "Estadio Azteca",
    fifaName: "Mexico City Stadium",
    city: "Mexico City",
    country: "Mexico",
    capacity: 87500,
    lat: 19.3029,
    lng: -99.1505,
    transitLines: [
      { type: "Light Rail", name: "Tren Ligero", from: "Tasqueña", color: "#2DD36F" },
      { type: "Metro", name: "Línea 2 + Tren Ligero", from: "Centro Histórico", color: "#FF3B6B" },
    ],
    gates: ["1", "3", "6", "9"],
  },
  {
    key: "akron",
    name: "Estadio Akron",
    fifaName: "Guadalajara Stadium",
    city: "Zapopan, Jalisco",
    country: "Mexico",
    capacity: 48000,
    lat: 20.6819,
    lng: -103.4628,
    transitLines: [
      { type: "Bus", name: "Mi Macro Periférico", from: "Centro Guadalajara", color: "#FFB020" },
      { type: "Shuttle", name: "Estadio Shuttle", from: "Plaza Andares", color: "#4C86FF" },
    ],
    gates: ["A", "B", "C", "D"],
  },
  {
    key: "bbva",
    name: "Estadio BBVA",
    fifaName: "Monterrey Stadium",
    city: "Guadalupe, Nuevo León",
    country: "Mexico",
    capacity: 53500,
    lat: 25.669,
    lng: -100.244,
    transitLines: [
      { type: "Metro", name: "Metrorrey Línea 2", from: "Centro Monterrey", color: "#2DD36F" },
      { type: "Bus", name: "Transmetro Feeder", from: "Y Griega Station", color: "#FFB020" },
    ],
    gates: ["A", "C", "E", "G"],
  },
];

export const STADIUM_BY_KEY = Object.fromEntries(STADIUMS.map((s) => [s.key, s]));

/**
 * Bundled fixture snapshot for the FIFA World Cup 2026 knockout stage.
 *
 * The server is the source of truth (GET /api/matches, see server/matches.js);
 * this copy exists only so the Matches tab can paint instantly before that
 * request resolves, and so the app still works with the backend offline.
 *
 * `status` is "final" | "live" | "scheduled". `winProb` holds pre-match win
 * probabilities where known.
 */
export const MATCHES_2026 = [
  // --- Round of 16 (completed) ---
  { id: "r16-1", date: "2026-07-05", time: "16:00", stage: "Round of 16", home: "Brazil", away: "Norway", homeFlag: "\u{1F1E7}\u{1F1F7}", awayFlag: "\u{1F1F3}\u{1F1F4}", stadium: "lincoln", score: "1\u20132", status: "final" },
  { id: "r16-2", date: "2026-07-05", time: "21:00", stage: "Round of 16", home: "Mexico", away: "England", homeFlag: "\u{1F1F2}\u{1F1FD}", awayFlag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", stadium: "azteca", score: "2\u20133", status: "final" },
  { id: "r16-3", date: "2026-07-06", time: "15:00", stage: "Round of 16", home: "Portugal", away: "Spain", homeFlag: "\u{1F1F5}\u{1F1F9}", awayFlag: "\u{1F1EA}\u{1F1F8}", stadium: "metlife", score: "0\u20131", status: "final" },
  { id: "r16-4", date: "2026-07-06", time: "20:00", stage: "Round of 16", home: "USA", away: "Belgium", homeFlag: "\u{1F1FA}\u{1F1F8}", awayFlag: "\u{1F1E7}\u{1F1EA}", stadium: "sofi", score: "1\u20134", status: "final" },
  { id: "r16-5", date: "2026-07-07", time: "16:00", stage: "Round of 16", home: "Argentina", away: "Egypt", homeFlag: "\u{1F1E6}\u{1F1F7}", awayFlag: "\u{1F1EA}\u{1F1EC}", stadium: "hardrock", score: "3\u20132", status: "final" },
  { id: "r16-6", date: "2026-07-07", time: "20:00", stage: "Round of 16", home: "Switzerland", away: "Colombia", homeFlag: "\u{1F1E8}\u{1F1ED}", awayFlag: "\u{1F1E8}\u{1F1F4}", stadium: "att", score: "0\u20130 (5\u20134 pens)", status: "final" },

  // --- Quarter-finals (completed) ---
  { id: "qf-1", date: "2026-07-09", time: "16:00", stage: "Quarter-final", home: "France", away: "Morocco", homeFlag: "\u{1F1EB}\u{1F1F7}", awayFlag: "\u{1F1F2}\u{1F1E6}", stadium: "gillette", score: "2\u20130", status: "final" },
  { id: "qf-2", date: "2026-07-10", time: "15:00", stage: "Quarter-final", home: "Spain", away: "Belgium", homeFlag: "\u{1F1EA}\u{1F1F8}", awayFlag: "\u{1F1E7}\u{1F1EA}", stadium: "levis", score: "2\u20131", status: "final" },
  { id: "qf-3", date: "2026-07-11", time: "17:00", stage: "Quarter-final", home: "Norway", away: "England", homeFlag: "\u{1F1F3}\u{1F1F4}", awayFlag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", stadium: "arrowhead", score: "1\u20132", status: "final" },
  { id: "qf-4", date: "2026-07-11", time: "21:00", stage: "Quarter-final", home: "Argentina", away: "Switzerland", homeFlag: "\u{1F1E6}\u{1F1F7}", awayFlag: "\u{1F1E8}\u{1F1ED}", stadium: "nrg", score: "3\u20131", status: "final" },

  // --- Semi-finals ---
  { id: "sf-1", date: "2026-07-14", time: "15:00", stage: "Semi-final", home: "France", away: "Spain", homeFlag: "\u{1F1EB}\u{1F1F7}", awayFlag: "\u{1F1EA}\u{1F1F8}", stadium: "att", score: "0\u20132", status: "final" },
  { id: "sf-2", date: "2026-07-15", time: "15:00", stage: "Semi-final", home: "England", away: "Argentina", homeFlag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", awayFlag: "\u{1F1E6}\u{1F1F7}", stadium: "mercedes", score: "1\u20132", status: "final" },

  // --- Final rounds ---
  { id: "tpp", date: "2026-07-18", time: "17:00", stage: "Third place", home: "France", away: "England", homeFlag: "\u{1F1EB}\u{1F1F7}", awayFlag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", stadium: "hardrock", score: null, status: "scheduled", winProb: { home: 50.1, draw: 24.1, away: 25.8 } },
  { id: "final", date: "2026-07-19", time: "15:00", stage: "Final", home: "Spain", away: "Argentina", homeFlag: "\u{1F1EA}\u{1F1F8}", awayFlag: "\u{1F1E6}\u{1F1F7}", stadium: "metlife", score: null, status: "scheduled", winProb: { home: 41.4, draw: 31.3, away: 27.3 } },
];

// -----------------------------------------------------------------------------
// Past World Cup finals for the year dropdown in the "Upcoming" tab.
// -----------------------------------------------------------------------------
export const PAST_WORLD_CUPS = [
  { year: 2022, host: "Qatar", winner: "Argentina", winnerFlag: "🇦🇷", runnerUp: "France", runnerUpFlag: "🇫🇷", finalScore: "3–3 (4–2 pens)", venue: "Lusail Stadium" },
  { year: 2018, host: "Russia", winner: "France", winnerFlag: "🇫🇷", runnerUp: "Croatia", runnerUpFlag: "🇭🇷", finalScore: "4–2", venue: "Luzhniki Stadium" },
  { year: 2014, host: "Brazil", winner: "Germany", winnerFlag: "🇩🇪", runnerUp: "Argentina", runnerUpFlag: "🇦🇷", finalScore: "1–0 (a.e.t.)", venue: "Maracanã" },
  { year: 2010, host: "South Africa", winner: "Spain", winnerFlag: "🇪🇸", runnerUp: "Netherlands", runnerUpFlag: "🇳🇱", finalScore: "1–0 (a.e.t.)", venue: "Soccer City" },
  { year: 2006, host: "Germany", winner: "Italy", winnerFlag: "🇮🇹", runnerUp: "France", runnerUpFlag: "🇫🇷", finalScore: "1–1 (5–3 pens)", venue: "Olympiastadion" },
  { year: 2002, host: "South Korea / Japan", winner: "Brazil", winnerFlag: "🇧🇷", runnerUp: "Germany", runnerUpFlag: "🇩🇪", finalScore: "2–0", venue: "Yokohama" },
  { year: 1998, host: "France", winner: "France", winnerFlag: "🇫🇷", runnerUp: "Brazil", runnerUpFlag: "🇧🇷", finalScore: "3–0", venue: "Stade de France" },
  { year: 1994, host: "USA", winner: "Brazil", winnerFlag: "🇧🇷", runnerUp: "Italy", runnerUpFlag: "🇮🇹", finalScore: "0–0 (3–2 pens)", venue: "Rose Bowl" },
  { year: 1990, host: "Italy", winner: "Germany", winnerFlag: "🇩🇪", runnerUp: "Argentina", runnerUpFlag: "🇦🇷", finalScore: "1–0", venue: "Stadio Olimpico" },
  { year: 1986, host: "Mexico", winner: "Argentina", winnerFlag: "🇦🇷", runnerUp: "Germany", runnerUpFlag: "🇩🇪", finalScore: "3–2", venue: "Estadio Azteca" },
];

/**
 * Today's date as YYYY-MM-DD, from the user's clock.
 *
 * This must NOT be hardcoded: a frozen date makes finished matches show as
 * "upcoming" the moment the tournament moves on.
 * @returns {string}
 */
export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @param {{date:string, status?:string}} match @returns {boolean} */
export function isUpcoming(match) {
  if (match.status === "final") return false; // a played match is never "upcoming"
  return match.date >= today();
}

/** @param {{status?:string}} match @returns {boolean} */
export function isLive(match) {
  return match.status === "live";
}

// -----------------------------------------------------------------------------
// Stadium visits.
//
// A "visit" is any time the fan loads a matchday - whether or not it lines up
// with an official fixture. We record every visit so the You tab can show a
// history of stadiums attended, then enrich each one with match details when
// the stadium + date happens to match a scheduled game.
//
// To avoid a database migration, a visit's identity is encoded into the
// existing match_id string as "visit:<stadiumKey>:<date>". Real fixtures keep
// their own id (e.g. "final"), so both kinds coexist in the same list.
// -----------------------------------------------------------------------------

/**
 * Build the stable id for a visit. If it matches a known fixture, use that
 * fixture's id so we don't double-count; otherwise synthesize one.
 * @param {string} stadiumKey
 * @param {string} date YYYY-MM-DD
 * @returns {string}
 */
export function visitId(stadiumKey, date) {
  const fixture = MATCHES_2026.find((m) => m.stadium === stadiumKey && m.date === date);
  return fixture ? fixture.id : `visit:${stadiumKey}:${date}`;
}

/**
 * Decode a stored attended record back into a visit.
 * Accepts either a fixture id ("final") or a synthetic id
 * ("visit:metlife:2026-07-19").
 * @param {string} id
 * @param {string|null} [seat]
 * @returns {{id:string, stadiumKey:string, date:string, seat:string|null, match:object|null}}
 */
export function decodeVisit(id, seat = null) {
  const fixture = MATCHES_2026.find((m) => m.id === id);
  if (fixture) {
    return { id, stadiumKey: fixture.stadium, date: fixture.date, seat, match: fixture };
  }
  if (id.startsWith("visit:")) {
    const [, stadiumKey, date] = id.split(":");
    // A fixture may have been added later for this stadium+date - enrich if so.
    const match = MATCHES_2026.find((m) => m.stadium === stadiumKey && m.date === date) || null;
    return { id, stadiumKey, date, seat, match };
  }
  // Unknown id (e.g. a fixture no longer in the snapshot). Keep it visible.
  return { id, stadiumKey: null, date: null, seat, match: null };
}