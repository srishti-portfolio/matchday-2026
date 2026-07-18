import { useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useT } from "../i18n/I18nContext.jsx";
import { STADIUM_BY_KEY, MATCHES_2026 } from "../data.js";
import MatchPicker from "./MatchPicker.jsx";
import StadiumLayout from "./StadiumLayout.jsx";
import StadiumMap from "./StadiumMap.jsx";
import TransitRoutes from "./TransitRoutes.jsx";
import CrowdLevels from "./CrowdLevels.jsx";

export default function Home() {
  const t = useT();
  const { user, setSelection } = useUser();
  const [loading, setLoading] = useState(false);
  const selection = user.selection;

  function handleConfirm(sel) {
    setLoading(true);
    setTimeout(() => {
      setSelection(sel);
      setLoading(false);
    }, 900);
  }

  if (loading) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-line border-t-pitch rounded-full animate-spin" />
        <p className="text-muted text-sm">{t("home.loading")}</p>
      </div>
    );
  }

  if (!selection) return <MatchPicker onConfirm={handleConfirm} />;

  const stadium = STADIUM_BY_KEY[selection.stadiumKey];
  const match = selection.matchId
    ? MATCHES_2026.find((m) => m.id === selection.matchId)
    : null;

  return (
    <div>
      <header className="floodlit px-5 pt-7 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-pitch text-xs font-semibold tracking-[0.15em] uppercase">
            <span className="w-2 h-2 rounded-full bg-live animate-pulseLive" />
            {t("home.eyebrow")}
          </div>
          <button
            onClick={() => setSelection(null)}
            className="text-xs text-muted border border-line rounded-full px-3 py-1.5 active:scale-95 transition-transform"
          >
            {t("home.changeGame")}
          </button>
        </div>

        {match ? (
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              {match.stage}
            </span>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 text-xl font-display font-extrabold">
                <span>{match.homeFlag}</span>
                <span>{match.home}</span>
              </div>
              <span className="text-muted text-sm">{t("common.vs")}</span>
              <div className="flex items-center gap-2 text-xl font-display font-extrabold">
                <span>{match.awayFlag}</span>
                <span>{match.away}</span>
              </div>
            </div>
          </div>
        ) : (
          <h2 className="mt-4 font-display font-extrabold text-2xl">{t("home.yourMatchday")}</h2>
        )}

        <p className="text-muted text-sm mt-2">
          {stadium.name} - {formatDate(selection.date)}
          {match ? ` - ${match.time}` : ""}
        </p>
        <p className="text-muted text-xs mt-0.5">{t("home.seat", { seat: selection.seat })}</p>
      </header>

      <div className="mt-2">
        <StadiumLayout stadium={stadium} seat={selection.seat} />
      </div>
      <StadiumMap stadium={stadium} />
      <TransitRoutes stadium={stadium} />
      <CrowdLevels stadium={stadium} matchId={selection.matchId} />
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