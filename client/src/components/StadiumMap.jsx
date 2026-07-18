import { useT } from "../i18n/I18nContext.jsx";
// Uses Google Maps when VITE_GOOGLE_MAPS_KEY is set, otherwise falls back to a
// keyless OpenStreetMap embed so the app always shows a map. Add your key to
// client/.env (see client/.env.example) to switch to Google Maps.

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function StadiumMap({ stadium }) {
  const t = useT();
  const { lat, lng, name, city } = stadium;

  const useGoogle = Boolean(GMAPS_KEY);
  const googleSrc = `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${lat},${lng}&zoom=15`;
  const d = 0.012;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  const gmapsDir = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="mx-5 mt-4 bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="font-display font-bold text-lg">{t("map.title")}</h3>
        <span className="text-[11px] text-muted">{city}</span>
      </div>
      <div className="relative h-52 bg-ink">
        <iframe
          title={`Map of ${name}`}
          src={useGoogle ? googleSrc : osmSrc}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <a
          href={gmapsDir}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center bg-pitch text-ink font-semibold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-transform"
        >
          Directions
        </a>
        <a
          href={useGoogle ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : osmLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center bg-elevated text-text font-semibold text-sm py-2.5 rounded-xl border border-line active:scale-[0.98] transition-transform"
        >
          {t("map.openMap")}
        </a>
      </div>
    </div>
  );
}
