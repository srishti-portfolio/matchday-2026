# Matchday — FIFA World Cup 2026 Smart Stadium Companion

A GenAI-powered stadium companion for the **FIFA World Cup 2026**, built for the
*Smart Stadiums & Tournament Operations* challenge. Fans navigate the venue, beat
the crowds, plan transit, and get help **in any of 12 languages**.

**Live demo**

- **App (frontend):** https://matchday-2026-iota.vercel.app
- **API (backend):** https://matchday-2026.onrender.com/api/health

> The backend runs on a free tier that sleeps when idle, so the **first request
> after a quiet spell can take 30–60 seconds to wake up**. After that it's instant.

It's a **full-stack app in two independently deployable pieces**:

- **`client/`** — a Vite + React single-page app (deployed as a static site on Vercel)
- **`server/`** — an Express API that talks to the **Anthropic Claude API** and a
  **Neon Postgres** database (deployed separately on Render)

In development the client proxies `/api` to the server; in production the client
points at the deployed server via one environment variable.

---

## Features

- **Accounts** — create an account with a name, password, and preferred language.
  Passwords are bcrypt-hashed and stored in Neon Postgres; sessions use JWTs.
- **Full internationalization** — the **entire UI** is available in 12 languages
  (English, Spanish, French, Portuguese, German, Italian, Dutch, Arabic, Japanese,
  Korean, Hindi, Chinese). Pick a language on sign-up and the whole app switches
  instantly — including **right-to-left layout for Arabic**. Change it any time in
  the You tab. The sign-up screen previews the language live as you choose.
- **Home** — pick any World Cup 2026 match from a single dropdown (grouped by
  stage); its stadium and date fill in automatically. Then see a stadium layout with
  your section, a map with directions, public-transit routes, and **live crowd
  levels per entry gate** with a quietest-gate recommendation.
- **Assistant** — two Claude-powered modes: a **translator** (your language ↔ the
  host country's, with voice input and read-aloud) and an **ask-anything chatbot**
  for stadium, transit, ticketing, and tournament questions.
- **Matches** — 2026 fixtures (upcoming + results, with win probabilities) and past
  World Cup finals via a year dropdown. The feed honestly labels whether scores are
  **live** or a **bundled snapshot**.
- **You** — profile photo upload, editable details, language switch, and a record of
  matches you've attended (added with an explicit "I attended this" button).

---

## Tech stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Frontend  | React 18 + Vite 5, Tailwind CSS                               |
| Backend   | Node + Express (ESM)                                          |
| Database  | Neon (serverless Postgres)                                    |
| AI        | Anthropic Claude API (`claude-haiku-4-5`)                     |
| Auth      | bcrypt password hashing + JWT sessions                        |
| Testing   | Vitest (**118 tests**: 52 client, 66 server)                 |
| Hosting   | Vercel (frontend) + Render (backend)                          |

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
│       ├── App.jsx        shell: language provider + auth gate + tab routing
│       ├── api.js         fetch wrapper -> backend (JWT handling)
│       ├── index.css      design system
│       ├── data.js        stadiums, fixtures, languages, date helpers
│       ├── i18n/          internationalization
│       │   ├── I18nContext.jsx   provider + useT() hook
│       │   ├── strings.js        all 12 languages
│       │   └── detect.js         browser-language detection
│       ├── context/UserContext.jsx
│       └── components/    Home, Assistant, Upcoming, You, TabBar, ...
└── server/               Express API  (the backend)
    ├── index.js           entry point (boots DB, starts server)
    ├── app.js             routes + helmet, CORS, rate limits, validation
    ├── db.js              Neon Postgres pool + schema
    ├── auth.js            bcrypt hashing, JWT, requireAuth middleware
    ├── claude.js          Anthropic client + chat/translation logic
    ├── matches.js         fixtures (snapshot + live-feed ready)
    ├── crowd-store.js     crowd baseline + judge/sensor overrides
    ├── *.test.js          unit + integration tests
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

- **App:** http://localhost:5173  ← open this one
- API: http://localhost:4000  (JSON only)

Check the backend is fully configured at http://localhost:4000/api/health — you
want `{"ok":true,"aiConfigured":true,"dbConfigured":true}`. The AI model defaults to
`claude-haiku-4-5` (override with `ANTHROPIC_MODEL`). Get an API key at
https://console.anthropic.com — note the API is billed separately from a Claude
Pro/Max subscription, so add a little credit under Plans & Billing.

---

## For judges: testing with your own data

Two features are designed to be verified with **your** data, not ours.

### 1. Crowd levels — feed in any numbers

The crowd meters run on a live-drifting simulated baseline by default. During a
demo you can override them with real numbers to prove the data flows end to end:

**From the app:** open the **Home** tab, pick a game, scroll to **Entry gates**, and
**press and hold the "Entry gates" heading for ~1 second** to reveal the operator
controls (hidden from ordinary fans). Tap **Input data**, drag the sliders, and press
**Save**. The meters, wait-time estimates, and "quietest gate" recommendation all
recalculate from your numbers immediately, and any gate you set is tagged as manual
input.

**From the API (scriptable):**

```bash
# Set your own levels (0-100 per gate)
curl -X POST https://matchday-2026.onrender.com/api/crowd/mercedes \
  -H "Content-Type: application/json" \
  -d '{"levels": {"A": 15, "B": 90, "C": 45, "D": 72}}'

# Read them back
curl "https://matchday-2026.onrender.com/api/crowd/mercedes?gates=A,B,C,D"

# Clear your data and return to the simulated baseline
curl -X DELETE https://matchday-2026.onrender.com/api/crowd/mercedes
```

Gates you haven't set keep a simulated live baseline, so the two are always
distinguishable: `"source": "manual"` (yours) vs `"source": "live"` (simulated).
Real sensor hardware plugs in at the same place — replace the baseline in
`server/crowd-store.js` and the rest of the pipeline is unchanged.

### 2. Match data — live feed or snapshot

`GET /api/matches` tells you which it is:

- `"source": "live"` — pulled from a real football data provider (see below).
- `"source": "snapshot", "snapshotTaken": "..."` — the accurate-but-frozen fixture
  set bundled with the code. The Matches tab labels this honestly on screen.

To enable live scores, get a free key at https://www.football-data.org/client/register
and set `LIVE_FOOTBALL_API_KEY` on the server. Responses are normalised in
`server/matches.js`, cached for 30s, and fall back to the snapshot if the provider
is down — so the app never breaks.

---

## Internationalization

The whole interface is translated, not just labels here and there. A single
language value (from the account, or the browser before sign-in) drives every
string through a lightweight context:

- **`client/src/i18n/strings.js`** — 12 locales, ~120 keys each. English is the
  reference; every other locale mirrors its keys. Missing keys fall back to English
  automatically, so a partial translation never shows a blank.
- **`client/src/i18n/I18nContext.jsx`** — the `useT()` hook every component uses,
  with `{placeholder}` interpolation and automatic `dir="rtl"` for Arabic.
- **`client/src/i18n/detect.js`** — guesses a starting language from the browser.

The 52 client tests include a full i18n suite that checks key parity across all 12
languages, interpolation, RTL handling, and language detection.

> The non-English translations were machine-generated for the hackathon. They read
> naturally, but a production launch should have native speakers review them —
> especially the football-specific phrasing. To edit any wording, change the
> relevant key in `strings.js` (the `en` block is the source of truth).

---

## Database (Neon)

Accounts are stored in **Neon** (serverless Postgres). Setup takes a minute:

1. Create a free project at https://neon.tech
2. Copy the connection string from the dashboard — it looks like:
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
`dbConfigured: false`, the auth endpoints return a clear 503, and the client falls
back to local demo accounts so the app can be demoed on any machine.

---

## Deploy (frontend and backend separately)

The backend must be deployed first so the frontend has a URL to point at.

### 1. Backend — deploy `server/` on Render

1. New → **Web Service**, connect your repo.
2. **Root directory:** `server`
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. **Environment variables:**
   - `ANTHROPIC_API_KEY = sk-ant-...`
   - `DATABASE_URL = postgresql://...` (your Neon connection string)
   - `JWT_SECRET = <long random string>`
   - optional: `ANTHROPIC_MODEL`, `LIVE_FOOTBALL_API_KEY`, and
     `CORS_ORIGIN = https://your-app.vercel.app` (set after the frontend is up)

   `PORT` is provided by the host automatically.
6. Deploy, then copy the service URL, e.g. `https://matchday-2026.onrender.com`.

Check it's live: `https://<your-api>/api/health` should return
`{"ok":true,"aiConfigured":true,"dbConfigured":true}`.

### 2. Frontend — deploy `client/` on Vercel

1. New Project → import the same repo.
2. **Root directory:** `client`
3. Framework preset: **Vite** (build `npm run build`, output `dist`).
4. **Environment variable:** `VITE_API_URL = https://<your-api>` (the backend URL).
5. Deploy.

`VITE_API_URL` is baked in at build time and tells the frontend where the API lives.

### 3. Connect them — set CORS on the backend

Back on Render, add `CORS_ORIGIN = https://<your-app>.vercel.app` (no trailing
slash). The backend then trusts requests from your deployed frontend, and login,
the assistant, and everything else work end to end.

> **Note (case-sensitive builds):** Vercel/Render build on Linux, which is
> case-sensitive, while Windows/macOS are not. Make sure imported filenames match
> exactly (e.g. `I18nContext.jsx`) or a build that works locally can fail in the cloud.

---

## Security & production notes

- **Auth**: Neon Postgres, bcrypt-hashed passwords, JWT sessions. Passwords never
  leave the server; the API never returns a password hash.
- **Hardening**: `helmet` headers, rate limiting (20 auth attempts / 15 min, 30 AI
  calls / min), parameterised SQL, and identical errors for unknown-user vs
  wrong-password (no account enumeration).
- **CORS**: a `CORS_ORIGIN` allowlist locks the API to your deployed frontend.
- **Graceful degradation**: the app never hard-crashes on a failed dependency —
  the match feed falls back to a snapshot, the map falls back to OpenStreetMap, and
  auth falls back to demo mode without a database.

### API endpoints

```
GET    /api/health              { ok, aiConfigured, dbConfigured }

POST   /api/auth/register       { name, password, language } -> { token, user }   (409 if name taken)
POST   /api/auth/login          { name, password }           -> { token, user }
GET    /api/profile             (Bearer token) -> { user, attended[] }
PATCH  /api/profile             (Bearer token) { name?, password?, language?, avatar? }
GET    /api/attended            (Bearer token) -> { attended[] }
POST   /api/attended            (Bearer token) { matchId, seat }

GET    /api/matches             { source, matches[], snapshotTaken? }
GET    /api/crowd/:stadium      ?gates=A,B,C  -> { gates[] }  (live baseline or manual)
POST   /api/crowd/:stadium      { levels: { A: 40 } }         (judge / sensor input)
DELETE /api/crowd/:stadium      reset overrides
POST   /api/chat                { messages[], language } -> { reply }
POST   /api/translate           { text, fromLanguage, toLanguage } -> { translation }
```

### Other notes

- **Maps**: set `VITE_GOOGLE_MAPS_KEY` (client `.env`) to use Google Maps. Without a
  key it falls back to a keyless OpenStreetMap embed, so the map always renders.
- **Voice** uses the browser Web Speech API (best in Chrome/Edge).
- **The assistant** answers general questions (stadiums, transit, tickets, tournament
  info) from the Claude model's knowledge. Live, changing data — scores and crowd
  levels — lives in the dedicated Matches tab and Entry gates, which pull from the
  backend in real time.

---

## Testing

```bash
npm test                    # all 118 tests (client + server)
npm --prefix client test    # 52 client tests (components + full i18n suite)
npm --prefix server test    # 66 server tests (auth, routes, DB integration, AI)
```

---

*Built for the Hack2Skill "Smart Stadiums & Tournament Operations" challenge.
"FIFA" and "World Cup" are trademarks of FIFA, referenced here only to describe the
event this project is designed for.*