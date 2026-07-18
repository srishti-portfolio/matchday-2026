# Matchday — FIFA World Cup 2026 Smart Stadium Companion

A GenAI-powered stadium companion for the **FIFA World Cup 2026**, built for the
*Smart Stadiums & Tournament Operations* challenge. Fans navigate the venue, beat
the crowds, plan transit, and get help in their own language.

It's a **full-stack app in two independently deployable pieces**:

- **`client/`** — a Vite + React single-page app (the frontend you deploy as a static site)
- **`server/`** — an Express API that talks to the **Anthropic Claude API** (the backend you deploy separately)

In development the client proxies `/api` to the server; in production the client
points at your deployed server via one environment variable.

---

## Features

- **Sign in / create account** — name, password, preferred language.
- **Home** — pick your game (stadium, date, seat), then see a stadium layout with
  your section, a map with directions, public-transit routes, and live crowd
  levels per entry gate with a quietest-gate recommendation.
- **Assistant** — two Claude-powered modes: a **translator** (your language → the
  host country's, with voice input and read-aloud) and an **ask-anything chatbot**.
- **Matches** — 2026 fixtures (upcoming + results) and past World Cup finals via a
  year dropdown.
- **You** — profile photo upload, editable details, and attended matches.

---

## Project structure

```
matchday/
├── package.json          root scripts (run client + server together)
├── client/               Vite + React SPA  (the frontend)
│   ├── vite.config.js     dev proxy /api -> :4000
│   ├── index.html
│   └── src/
│       ├── main.jsx       React entry
│       ├── App.jsx        shell: auth gate + tab routing
│       ├── api.js         fetch wrapper -> backend
│       ├── index.css      design system
│       ├── data.js        stadiums, fixtures, languages
│       ├── crowd.js       crowd-level simulation
│       ├── context/UserContext.jsx
│       └── components/    Home, Assistant, Upcoming, You, TabBar, ...
└── server/               Express API  (the backend)
    ├── index.js           entry point (boots DB, starts server)
    ├── app.js             routes + helmet, CORS, rate limits, validation
    ├── db.js              Neon Postgres pool + schema
    ├── auth.js            bcrypt hashing, JWT, requireAuth middleware
    ├── claude.js          Anthropic client + chat/translation logic
    ├── matches.js         fixtures (source of truth; live-feed ready)
    ├── crowd-store.js     crowd baseline + judge/sensor overrides
    ├── *.test.js          unit + integration tests (49 tests)
    └── .env.example
```

---

## Run it locally

Requires **Node.js 18.17+**.

```bash
# 1. Install everything (root, server, client)
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env and set:
#      ANTHROPIC_API_KEY=sk-ant-...        (assistant + translator)
#      DATABASE_URL=postgresql://...       (Neon - real accounts)
#      JWT_SECRET=<long random string>     (signs login tokens)

# 3. Start both apps together
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:4000

The app runs without a key — the translator and chatbot just show a "not connected"
message until you add one. Everything else works offline. Get a key at
https://console.anthropic.com/settings/keys. The AI model defaults to
`claude-haiku-4-5` (override with `ANTHROPIC_MODEL`).

---

## For judges: testing with your own data

Two features are designed to be verified with **your** data, not ours.

### 1. Crowd levels — feed in any numbers

**From the app (no tools needed):** open the **Home** tab, pick a game, scroll to
**Entry gates**, tap **Input data**, drag the sliders to whatever levels you want, and
press **Save crowd data**. The meters, the wait-time estimates and the
"quietest gate" recommendation all recalculate from your numbers immediately, and any
gate you set is tagged **Judge input**.

**From the API (scriptable):**

```bash
# Set your own levels (0-100 per gate)
curl -X POST https://<your-api>/api/crowd/mercedes \
  -H "Content-Type: application/json" \
  -d '{"levels": {"1": 15, "2": 90, "3": 45, "5": 72}}'

# Read them back
curl "https://<your-api>/api/crowd/mercedes?gates=1,2,3,5"
# -> Gate 1: 15% Low (~3min) [manual]   <- your data
#    Gate 2: 90% Busy (~20min) [manual]

# Clear your data and return to the simulated baseline
curl -X DELETE https://<your-api>/api/crowd/mercedes
```

Gates you haven't set keep a simulated live baseline, so the two are always
distinguishable: `"source": "manual"` (yours) vs `"source": "live"` (simulated).
Real sensor hardware plugs in at the same place - replace `baselineLevel()` in
`server/crowd-store.js` and the rest of the pipeline is unchanged.

### 2. Match data — live feed or snapshot

`GET /api/matches` tells you which it is:

- `"source": "live"` — pulled from a real football data provider (see below).
- `"source": "snapshot", "snapshotTaken": "2026-07-15"` — the accurate-but-frozen
  fixture set bundled with the code. The Matches tab labels this honestly on screen.

To enable live scores, get a free key at https://www.football-data.org/client/register
and set `LIVE_FOOTBALL_API_KEY` on the server. Responses are normalised in
`server/matches.js` (`normaliseMatch`), cached for 30s, and fall back to the snapshot
if the provider is down - so the app never breaks.

---

## Database (Neon)

Accounts are stored in **Neon** (serverless Postgres). Setup takes a minute:

1. Create a free project at https://neon.tech
2. Copy the connection string from the dashboard - it looks like:
   `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Put it in `server/.env` as `DATABASE_URL`, and set a `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Start the server. Tables are created automatically on boot:

   | table              | purpose                                                      |
   | ------------------ | ------------------------------------------------------------ |
   | `users`            | name (unique), bcrypt `password_hash`, language, avatar       |
   | `attended_matches` | match + seat per user, unique per (user, match), indexed      |

**Passwords are hashed with bcrypt (cost 12) and never leave the server.** Sessions
use JWTs (7-day expiry) sent as `Authorization: Bearer <token>`.

**No database? The app still runs.** If `DATABASE_URL` is unset, the server reports
`dbConfigured: false`, the auth endpoints return a clear 503, and the client
automatically falls back to local demo accounts so the app can be demoed on any
machine. Never use that mode for real users.

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Matchday: World Cup 2026 smart stadium app"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.env` files are gitignored, so your key is never committed.

---

## Deploy (frontend and backend separately)

### 1. Backend — deploy `server/` first

Any Node host works (Render, Railway, Fly.io, etc.). Example for **Render**:

1. New → **Web Service**, connect your repo.
2. **Root directory:** `server`
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. **Environment variables:**
   - `ANTHROPIC_API_KEY = sk-ant-...`
   - `DATABASE_URL = postgresql://...` (your Neon connection string)
   - `JWT_SECRET = <long random string>`
   - optional: `ANTHROPIC_MODEL`, `CORS_ORIGIN = https://your-app.vercel.app`

   `PORT` is provided by the host automatically.
6. Deploy, then copy the service URL, e.g. `https://matchday-api.onrender.com`.

Check it's live: `https://<your-api>/api/health` should return
`{"ok":true,"aiConfigured":true}`.

### 2. Frontend — deploy `client/`

Any static host works (Vercel, Netlify, Cloudflare Pages). Example for **Vercel**:

1. New Project → import the same repo.
2. **Root directory:** `client`
3. Framework preset: **Vite** (build `npm run build`, output `dist`).
4. **Environment variable:** `VITE_API_URL = https://<your-api>` (the backend URL from step 1).
5. Deploy.

That `VITE_API_URL` is baked in at build time and tells the frontend where the API
lives. The backend already allows cross-origin requests (CORS is enabled).

> Tip: if you'd rather serve everything from one place, you can also have the
> Express server serve the built `client/dist` — but deploying the two separately
> (as above) is the setup this project is wired for.

---

## Notes for production

- **Auth** uses Neon Postgres with bcrypt-hashed passwords and JWT sessions
  (`server/db.js`, `server/auth.js`). Without `DATABASE_URL` the client falls back
  to local demo accounts - fine for a preview, not for real users.
- **Security**: `helmet` headers, rate limiting (20 auth attempts / 15 min, 30 AI
  calls / min), parameterised SQL everywhere, identical errors for unknown-user vs
  wrong-password (no account enumeration), and a `CORS_ORIGIN` allowlist for production.
- **Fixtures + scores** are served by `GET /api/matches` (`server/matches.js`),
  synced to the real World Cup 2026 knockout stage. It's written to pull from a live
  provider: set `LIVE_FOOTBALL_API_URL` (+ `LIVE_FOOTBALL_API_KEY`) and map the
  payload in `fetchLiveMatches()`; without it, the bundled snapshot is returned.
- **Crowd levels are real-time and judge-inputtable.** `GET /api/crowd/:stadium`
  returns a live-drifting baseline per gate; `POST /api/crowd/:stadium` with
  `{ levels: { A: 40 } }` lets a judge (or a real sensor feed) set their own numbers,
  which the Home tab reflects immediately (tap **Input data** on the Entry gates
  card). Swap the baseline in `server/crowd-store.js` for a real sensor source.
- **Transit routes** remain illustrative per venue (`client/src/data.js`).

### API endpoints (server)

```
GET    /api/health              { ok, aiConfigured, dbConfigured }

POST   /api/auth/register       { name, password, language } -> { token, user }   (409 if name taken)
POST   /api/auth/login          { name, password }           -> { token, user }
GET    /api/profile             (Bearer token) -> { user, attended[] }
PATCH  /api/profile             (Bearer token) { name?, password?, language?, avatar? }
GET    /api/attended            (Bearer token) -> { attended[] }
POST   /api/attended            (Bearer token) { matchId, seat }

GET    /api/matches             { source, matches[] }
GET    /api/crowd/:stadium      ?gates=A,B,C  -> { gates[] }  (live baseline or manual)
POST   /api/crowd/:stadium      { levels: { A: 40 } }         (judge / sensor input)
DELETE /api/crowd/:stadium      reset overrides
POST   /api/chat                { messages[], language } -> { reply }
POST   /api/translate           { text, fromLanguage, toLanguage } -> { translation }
```
- **Maps**: set `VITE_GOOGLE_MAPS_KEY` (client `.env`) to use Google Maps (enable the
  "Maps Embed API" in Google Cloud). Without a key it falls back to a keyless
  OpenStreetMap embed, so the map always renders (`client/src/components/StadiumMap.jsx`).
- **Voice** uses the browser Web Speech API (best in Chrome/Edge).
- **Dependency note:** `npm audit` in `client/` flags an esbuild/Vite advisory that
  only affects the local dev server (not the production build) and is only fully
  resolved by upgrading to Vite 8, a breaking change. The project stays on stable
  Vite 5; the built static site is unaffected.
