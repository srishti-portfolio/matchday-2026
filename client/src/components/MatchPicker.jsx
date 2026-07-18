import { useMemo, useState } from "react";
import { MATCHES_2026, STADIUM_BY_KEY } from "../data.js";
import { useT } from "../i18n/I18nContext.jsx";

/**
 * Pick any World Cup 2026 match from a single dropdown. Selecting a match
 * auto-fills its stadium and date; the fan just adds their seat.
 */
export default function MatchPicker({ onConfirm }) {
  const t = useT();
  const [matchId, setMatchId] = useState(MATCHES_2026[0]?.id || "");
  const [seat, setSeat] = useState("");
  const [error, setError] = useState("");

  // Group matches by stage so the dropdown reads like a tournament bracket.
  const groups = useMemo(() => {
    const byStage = new Map();
    for (const m of MATCHES_2026) {
      if (!byStage.has(m.stage)) byStage.set(m.stage, []);
      byStage.get(m.stage).push(m);
    }
    return [...byStage.entries()];
  }, []);

  const match = MATCHES_2026.find((m) => m.id === matchId);
  const stadium = match ? STADIUM_BY_KEY[match.stadium] : null;

  function submit(e) {
    e.preventDefault();
    if (!match || !seat.trim()) {
      setError(t("picker.errorMissing"));
      return;
    }
    onConfirm({
      stadiumKey: match.stadium,
      date: match.date,
      seat: seat.trim(),
      matchId: match.id,
    });
  }

  return (
    <div className="px-5 pt-6">
      <h2 className="font-display font-extrabold text-2xl">{t("picker.title")}</h2>
      <p className="text-muted text-sm mt-1 mb-5">{t("picker.subtitle")}</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="match-select"
            className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
          >
            {t("picker.match")}
          </label>
          <select
            id="match-select"
            value={matchId}
            onChange={(e) => {
              setMatchId(e.target.value);
              setError("");
            }}
            className="w-full bg-ink border border-line rounded-xl px-4 py-3 text-text focus:border-pitch outline-none appearance-none"
          >
            {groups.map(([stage, matches]) => (
              <optgroup key={stage} label={stage}>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeFlag} {m.home} {t("common.vs")} {m.away} {m.awayFlag}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Stadium + date follow from the chosen match - shown, not editable. */}
        {match && stadium && (
          <div className="bg-surface border border-line rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-text font-semibold">
              <PinIcon />
              <span>
                {stadium.name} - {stadium.city}
              </span>
            </div>
            <p className="text-muted text-xs mt-1.5">
              {formatDate(match.date)} - {match.time}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="seat-input"
            className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
          >
            {t("picker.seatLabel")}
          </label>
          <input
            id="seat-input"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder={t("picker.seatPlaceholder")}
            className="w-full bg-ink border border-line rounded-xl px-4 py-3 text-text placeholder:text-muted/60 focus:border-pitch outline-none"
          />
        </div>

        {error && <p className="text-live text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-pitch text-ink font-display font-extrabold text-lg py-3.5 rounded-xl active:scale-[0.98] transition-transform"
        >
          {t("picker.submit")}
        </button>
      </form>
    </div>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pitch shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}