import { useT } from "../i18n/I18nContext.jsx";
export default function TransitRoutes({ stadium }) {
  const t = useT();
  return (
    <div className="mx-5 mt-4 bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg">{t("transit.title")}</h3>
        <span className="text-[11px] text-muted">{t("transit.subtitle")}</span>
      </div>

      <div className="space-y-3">
        {stadium.transitLines.map((line) => (
          <div key={line.name} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
              <span
                className="w-0.5 flex-1 mt-1 min-h-[24px]"
                style={{ backgroundColor: line.color, opacity: 0.35 }}
              />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{line.name}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${line.color}22`, color: line.color }}
                >
                  {line.type}
                </span>
              </div>
              <p className="text-muted text-xs mt-0.5">
                Board from <span className="text-text">{line.from}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-muted/70 text-[11px] mt-3 leading-relaxed">
        Match-day transit is often free with a valid ticket. Check your host city transit
        app for live times.
      </p>
    </div>
  );
}
