import { useT } from "../i18n/I18nContext.jsx";
export default function StadiumLayout({ stadium, seat }) {
  const t = useT();
  const gates = stadium.gates;
  const seatNum = parseInt((seat || "").replace(/\D/g, "").slice(0, 3) || "0", 10);
  const highlightAngle = (seatNum % 360) || 40;

  const gatePositions = [
    { x: 150, y: 18, anchor: "middle" },
    { x: 292, y: 100, anchor: "end" },
    { x: 150, y: 187, anchor: "middle" },
    { x: 8, y: 100, anchor: "start" },
  ];

  const rad = (highlightAngle * Math.PI) / 180;
  const cx = 150 + Math.cos(rad) * 118;
  const cy = 100 + Math.sin(rad) * 74;

  return (
    <div className="mx-5 bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg">{t("layout.title")}</h3>
        <span className="text-[11px] text-muted">{stadium.capacity.toLocaleString()} seats</span>
      </div>

      <svg viewBox="0 0 300 200" className="w-full">
        <ellipse cx="150" cy="100" rx="140" ry="88" fill="#0B0E13" stroke="#2A3340" strokeWidth="2" />
        <ellipse cx="150" cy="100" rx="120" ry="74" fill="none" stroke="#1C2430" strokeWidth="14" />
        <rect x="88" y="66" width="124" height="68" rx="8" fill="#153A22" stroke="#2DD36F" strokeWidth="1.5" />
        <line x1="150" y1="66" x2="150" y2="134" stroke="#2DD36F" strokeWidth="1" opacity="0.6" />
        <circle cx="150" cy="100" r="12" fill="none" stroke="#2DD36F" strokeWidth="1" opacity="0.6" />
        <rect x="88" y="86" width="12" height="28" fill="none" stroke="#2DD36F" strokeWidth="1" opacity="0.5" />
        <rect x="200" y="86" width="12" height="28" fill="none" stroke="#2DD36F" strokeWidth="1" opacity="0.5" />

        <circle cx={cx} cy={cy} r="10" fill="#FF3B6B" opacity="0.25" />
        <circle cx={cx} cy={cy} r="5" fill="#FF3B6B" />

        {gates.slice(0, 4).map((g, i) => {
          const p = gatePositions[i];
          return (
            <text
              key={g}
              x={p.x}
              y={p.y}
              textAnchor={p.anchor}
              fontSize="10"
              fontWeight="700"
              fill="#8B97A8"
              dominantBaseline="middle"
            >
              {t("layout.gate", { gate: g })}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-2 mt-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-live" />
        <span className="text-muted">
          {t("layout.yourSection")} - <span className="text-text font-semibold">{seat}</span>
        </span>
      </div>
    </div>
  );
}
