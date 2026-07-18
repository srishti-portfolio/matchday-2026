import { useEffect, useState } from "react";
import { MATCHES_2026, PAST_WORLD_CUPS, STADIUM_BY_KEY, isUpcoming, today } from "../data.js";
import { fetchMatches } from "../api.js";
import { useT } from "../i18n/I18nContext.jsx";

const up = isUpcoming;

export default function Upcoming() {
  const t = useT();
  const years = [2026, ...PAST_WORLD_CUPS.map((c) => c.year)];
  const [year, setYear] = useState(2026);
  const [matches, setMatches] = useState(MATCHES_2026);
  const [source, setSource] = useState("snapshot");
  const [snapshotTaken, setSnapshotTaken] = useState(null);

  // Pull live fixtures/scores from the backend; fall back to bundled data.
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await fetchMatches();
        if (alive && data?.matches?.length) {
          setMatches(data.matches);
          setSource(data.source || "snapshot");
          setSnapshotTaken(data.snapshotTaken ?? null);
        }
      } catch {
        /* keep bundled */
      }
    }
    load();
    const id = setInterval(load, 15000); // refresh scores periodically
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <header className="floodlit px-5 pt-7 pb-5">
        <div className="flex items-center gap-2 text-pitch text-xs font-semibold tracking-[0.15em] uppercase">
          <span className="w-2 h-2 rounded-full bg-live animate-pulseLive" />
          {t("matches.eyebrow")}
        </div>
        <h2 className="font-display font-extrabold text-2xl mt-3">{t("matches.title")}</h2>

        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mt-4 mb-1.5">
          {t("matches.year")}
        </label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full bg-ink border border-line rounded-xl px-4 py-3 text-text focus:border-pitch outline-none appearance-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
              {y === 2026 ? ` - ${t("matches.thisTournament")}` : ""}
            </option>
          ))}
        </select>
      </header>

      {year === 2026 ? (
        <Season2026 matches={matches} source={source} snapshotTaken={snapshotTaken} />
      ) : (
        <PastFinal year={year} />
      )}
    </div>
  );
}

function Season2026({ matches, source, snapshotTaken }) {
  const t = useT();
  const upcoming = matches.filter(up);
  const results = matches.filter((m) => !up(m)).reverse();

  return (
    <div className="px-5 py-5 space-y-6">
      <section>
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          {t("matches.upcoming")}
          <span className="text-xs font-semibold text-live bg-live/15 px-2 py-0.5 rounded-full">
            {upcoming.length}
          </span>
          {source === "live" ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-pitch uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulseLive" aria-hidden="true" />
              {t("matches.liveFeed")}
            </span>
          ) : (
            <span
              className="text-[10px] font-semibold text-muted"
              title={
                snapshotTaken
                  ? t("matches.snapshotTitle", { date: snapshotTaken })
                  : t("matches.snapshot")
              }
            >
              {t("matches.snapshot")}{snapshotTaken ? ` · ${snapshotTaken}` : ""}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {upcoming.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display font-bold text-lg mb-3">{t("matches.results")}</h3>
        <div className="space-y-3">
          {results.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchRow({ match }) {
  const t = useT();
  const stadium = STADIUM_BY_KEY[match.stadium];
  const played = !up(match);
  const live = match.status === "live";
  const winner = played ? winnerOf(match) : null;
  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-pitch uppercase tracking-wider">
          {match.stage}
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-live">
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulseLive" />
            LIVE
          </span>
        ) : (
          <span className="text-[11px] text-muted">
            {formatDate(match.date)} - {match.time}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Team flag={match.homeFlag} name={match.home} won={winner === "home"} />
          <Team flag={match.awayFlag} name={match.away} won={winner === "away"} />
        </div>
        <div className="text-right">
          {played || live ? (
            <span className="font-display font-extrabold text-lg">{match.score ?? "-"}</span>
          ) : (
            <span className="text-xs text-muted border border-line rounded-full px-2.5 py-1">
              {timeUntil(match.date, t)}
            </span>
          )}
        </div>
      </div>

      {match.winProb && !played && (
        <WinProb wp={match.winProb} home={match.home} away={match.away} />
      )}

      <p className="text-muted text-[11px] mt-2.5">
        {stadium ? `${stadium.name} - ${stadium.city}` : ""}
      </p>
    </div>
  );
}

function WinProb({ wp, home, away }) {
  const t = useT();
  const h = wp.home ?? 0;
  const d = wp.draw ?? 0;
  const a = wp.away ?? 0;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] text-muted mb-1">
        <span>{home} {h}%</span>
        <span>{t("matches.draw")} {d}%</span>
        <span>{a}% {away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden">
        <span style={{ width: `${h}%`, backgroundColor: "#2DD36F" }} />
        <span style={{ width: `${d}%`, backgroundColor: "#2A3340" }} />
        <span style={{ width: `${a}%`, backgroundColor: "#4C86FF" }} />
      </div>
    </div>
  );
}

function Team({ flag, name, won }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg leading-none">{flag}</span>
      <span className={`text-[15px] ${won ? "font-extrabold text-text" : "font-semibold"}`}>
        {name}
      </span>
      {won && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-pitch bg-pitch/15 px-1.5 py-0.5 rounded">
          {t("matches.won")}
        </span>
      )}
    </div>
  );
}

// Determine the winner from a score like "1–2" or "0–0 (5–4 p)".
function winnerOf(match) {
  if (!match.score) return null;
  const reg = match.score.split("(")[0].trim();
  const [h, a] = reg.split(/[–-]/).map((n) => parseInt(n.trim(), 10));
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return "home";
  if (a > h) return "away";
  const pens = /\((\d+)\s*[–-]\s*(\d+)/.exec(match.score);
  if (pens) {
    const ph = parseInt(pens[1], 10);
    const pa = parseInt(pens[2], 10);
    if (ph > pa) return "home";
    if (pa > ph) return "away";
  }
  return null;
}

function PastFinal({ year }) {
  const t = useT();
  const cup = PAST_WORLD_CUPS.find((c) => c.year === year);
  if (!cup) return null;
  return (
    <div className="px-5 py-5">
      <div className="bg-surface border border-line rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-pitch uppercase tracking-wider">
            {t("matches.final", { year: cup.year })}
          </span>
          <span className="text-[11px] text-muted">{cup.host}</span>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 mb-4">
          <div className="text-center flex-1">
            <div className="text-4xl">{cup.winnerFlag}</div>
            <p className="font-display font-extrabold text-lg mt-1">{cup.winner}</p>
            <span className="text-[10px] font-bold text-pitch uppercase tracking-wider">
              {t("matches.champions")}
            </span>
          </div>
          <div className="text-center">
            <span className="font-display font-black text-2xl">{cup.finalScore}</span>
          </div>
          <div className="text-center flex-1">
            <div className="text-4xl opacity-70">{cup.runnerUpFlag}</div>
            <p className="font-display font-extrabold text-lg mt-1 text-muted">{cup.runnerUp}</p>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {t("matches.runnersUp")}
            </span>
          </div>
        </div>

        <div className="border-t border-line pt-3 text-center">
          <p className="text-muted text-xs">
            {cup.venue} - {cup.host} {cup.year}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function timeUntil(iso, t) {
  const now = new Date(today() + "T00:00:00");
  const d = new Date(iso + "T00:00:00");
  const days = Math.round((d - now) / 86400000);
  if (days <= 0) return t("matches.today");
  if (days === 1) return t("matches.tomorrow");
  return t("matches.inDays", { days });
}
