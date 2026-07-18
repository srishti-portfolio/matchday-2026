import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "../i18n/I18nContext.jsx";
import { generateCrowd, recommendGate } from "../crowd.js";
import { fetchCrowd, saveCrowd } from "../api.js";

const TONE = {
  pitch: { bar: "#2DD36F", text: "text-pitch" },
  amber: { bar: "#FFB020", text: "text-amber" },
  live: { bar: "#FF3B6B", text: "text-live" },
};

const POLL_MS = 4000;

/** One gate's meter. Memoised: only re-renders when its own numbers change. */
const GateRow = memo(function GateRow({ gate, level, tone, wait, source }) {
  const t = useT();
  const colors = TONE[tone] || TONE.pitch;
  const label = t(`crowd.level${tone === "live" ? "Busy" : tone === "amber" ? "Moderate" : "Low"}`);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold flex items-center gap-2">
          {t("layout.gate", { gate })}
          {source === "manual" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-transit bg-transit/15 px-1.5 py-0.5 rounded">
              {t("crowd.judgeInput")}
            </span>
          )}
        </span>
        <span className={`text-xs font-semibold ${colors.text}`}>
          {label} - {t("crowd.minutes", { wait })}
        </span>
      </div>
      <div
        className="h-2 bg-ink rounded-full overflow-hidden"
        role="meter"
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t("layout.gate", { gate })}: ${label}, ${t("crowd.minutes", { wait })}`}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${level}%`, backgroundColor: colors.bar }}
        />
      </div>
    </div>
  );
});

export default function CrowdLevels({ stadium, matchId }) {
  const t = useT();
  const [crowd, setCrowdState] = useState(() =>
    generateCrowd(stadium.key, matchId || "na", stadium.gates, 0)
  );
  const [live, setLive] = useState(false);
  const [editing, setEditing] = useState(false);
  // The judge/operator input controls are hidden from ordinary fans. Long-press
  // the heading (~1s) to reveal them during a demo; press again to hide.
  const [judgeMode, setJudgeMode] = useState(false);
  const holdTimer = useRef(null);

  function startHold() {
    holdTimer.current = setTimeout(() => setJudgeMode((on) => !on), 800);
  }
  function cancelHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  // If judge mode is switched off while the editor is open, close the editor too.
  useEffect(() => {
    if (!judgeMode) setEditing(false);
  }, [judgeMode]);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const tickRef = useRef(0);

  // Only re-render when the numbers actually change - avoids a render every 4s.
  const commit = useCallback((next) => {
    setCrowdState((prev) => {
      if (
        prev.length === next.length &&
        prev.every((g, i) => g.level === next[i].level && g.source === next[i].source)
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchCrowd(stadium.key, stadium.gates);
      if (!data?.gates?.length) throw new Error("empty");
      commit(data.gates);
      setLive(true);
    } catch {
      // Backend unreachable: fall back to a local simulation so the UI stays live.
      tickRef.current += 1;
      commit(generateCrowd(stadium.key, matchId || "na", stadium.gates, tickRef.current));
      setLive(false);
    }
  }, [stadium.key, stadium.gates, matchId, commit]);

  useEffect(() => {
    load();
    let id = setInterval(load, POLL_MS);

    // Don't poll a tab nobody is looking at.
    const onVisibility = () => {
      clearInterval(id);
      if (document.visibilityState === "visible") {
        load();
        id = setInterval(load, POLL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const best = useMemo(() => recommendGate(crowd), [crowd]);

  const openEditor = useCallback(() => {
    setDraft(Object.fromEntries(crowd.map((g) => [g.gate, g.level])));
    setEditing(true);
  }, [crowd]);

  async function save() {
    setSaving(true);
    try {
      await saveCrowd(stadium.key, draft);
      await load();
      setEditing(false);
    } catch {
      /* leave the editor open so the judge can retry */
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-5 mt-4 mb-6 bg-surface border border-line rounded-2xl p-4" aria-label={t("crowd.title")}>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="font-display font-bold text-lg select-none"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          title="Hold to toggle operator input"
        >
          {t("crowd.title")}
        </h3>
        <div className="flex items-center gap-3">
          {judgeMode && (
            <button
              onClick={editing ? () => setEditing(false) : openEditor}
              aria-expanded={editing}
              className="text-[11px] font-semibold text-transit border border-transit/40 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
            >
              {editing ? t("crowd.close") : t("crowd.inputData")}
            </button>
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-live">
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulseLive" aria-hidden="true" />
            {t("crowd.live")}
          </span>
        </div>
      </div>

      {editing && (
        <div className="bg-ink border border-line rounded-xl p-3 mb-4 animate-fadeUp">
          <p className="text-xs text-muted mb-3">
{t("crowd.editorHint")}
          </p>
          <div className="space-y-3">
            {stadium.gates.map((g) => (
              <div key={g}>
                <label className="flex items-center justify-between mb-1" htmlFor={`gate-${g}`}>
                  <span className="text-sm font-semibold">{t("layout.gate", { gate: g })}</span>
                  <span className="text-xs text-muted tabular-nums">{draft[g] ?? 0}%</span>
                </label>
                <input
                  id={`gate-${g}`}
                  type="range"
                  min="0"
                  max="100"
                  value={draft[g] ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, [g]: Number(e.target.value) }))}
                  className="w-full accent-pitch"
                />
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full mt-3 bg-pitch text-ink font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {saving ? t("crowd.saving") : t("crowd.save")}
          </button>
        </div>
      )}

      {best && (
        <p
          className="bg-pitch/10 border border-pitch/30 rounded-xl px-3 py-2.5 mb-4 text-sm"
          aria-live="polite"
        >
{t("crowd.quietest", { gate: best.gate, wait: best.wait })}
        </p>
      )}

      <div className="space-y-3.5">
        {crowd.map((g) => (
          <GateRow key={g.gate} {...g} />
        ))}
      </div>

      <p className="text-muted/70 text-[11px] mt-3">
{live ? t("crowd.sourceLive") : t("crowd.sourceOffline")}
      </p>
    </section>
  );
}