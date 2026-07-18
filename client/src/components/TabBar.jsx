import { useT } from "../i18n/I18nContext.jsx";

const TABS = [
  { id: "home", key: "tabs.home", icon: HomeIcon },
  { id: "assistant", key: "tabs.assistant", icon: SparkIcon },
  { id: "upcoming", key: "tabs.matches", icon: TrophyIcon },
  { id: "you", key: "tabs.you", icon: UserIcon },
];

export default function TabBar({ tab, onTab }) {
  const t = useT();
  return (
    <nav className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-line">
      <div className="flex">
        {TABS.map(({ id, key, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-pitch rounded-full" />
              )}
              <Icon active={active} />
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  active ? "text-pitch" : "text-muted"
                }`}
              >
                {t(key)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function base(active) {
  return {
    width: 22,
    height: 22,
    fill: "none",
    stroke: active ? "#2DD36F" : "#8B97A8",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
}

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" {...base(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function SparkIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" {...base(active)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.4 11 16 12l-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z" />
    </svg>
  );
}
function TrophyIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" {...base(active)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M10 14v3M14 14v3M8 20h8" />
    </svg>
  );
}
function UserIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" {...base(active)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
