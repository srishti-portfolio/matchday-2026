import { useRef, useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { LANGUAGES, MATCHES_2026, STADIUM_BY_KEY, decodeVisit, visitId } from "../data.js";
import { useT } from "../i18n/I18nContext.jsx";

export default function You({ onSignedOut }) {
  const t = useT();
  const { user, updateProfile, signOut, mode, addAttended } = useUser();
  const fileRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  // Never seeded from user.password: with a database the server (correctly)
  // never sends the password back. Empty means "leave my password unchanged".
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState(user.language);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Every recorded visit, newest first, enriched with match details when the
  // stadium + date lines up with a fixture. Plain stadium visits show too.
  const visits = [...user.attended]
    .reverse()
    .map((a) => decodeVisit(a.id, a.seat))
    .filter((v) => v.stadiumKey); // drop anything we can't place on a map

  // The match currently loaded in the Home tab, if any - the fan taps a button
  // to record that they actually attended it (it isn't recorded automatically).
  const current = user.selection;
  const currentMatch = current
    ? MATCHES_2026.find((m) => m.id === current.matchId) ||
      MATCHES_2026.find((m) => m.stadium === current.stadiumKey && m.date === current.date)
    : null;
  const currentId = current ? visitId(current.stadiumKey, current.date) : null;
  const alreadyRecorded = currentId ? user.attended.some((a) => a.id === currentId) : false;

  function recordCurrent() {
    if (current) addAttended(current.stadiumKey, current.date, current.seat);
  }

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t("you.errorImage"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result });
    reader.readAsDataURL(file);
  }

  function startEditing() {
    setName(user.name);
    setLanguage(user.language);
    setPassword("");
    setError("");
    setEditing(true);
  }

  async function save() {
    setError("");
    if (!name.trim()) {
      setError(t("you.errorName"));
      return;
    }
    if (password && password.length < 6) {
      setError(t("you.errorPassword"));
      return;
    }

    const patch = { name: name.trim(), language };
    if (password) patch.password = password; // only change it if they typed one

    setSaving(true);
    try {
      const res = await updateProfile(patch);
      if (!res?.ok) {
        setError(res?.error || t("you.errorSave"));
        return;
      }
      setPassword("");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    signOut();
    onSignedOut?.();
  }

  return (
    <div>
      <header className="floodlit px-5 pt-8 pb-6 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full border-2 border-pitch overflow-hidden bg-elevated flex items-center justify-center mx-auto">
            {user.avatar ? (
              <img src={user.avatar} alt="Your profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-black text-3xl text-muted">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-pitch text-ink flex items-center justify-center border-2 border-ink active:scale-95 transition-transform"
            aria-label={t("you.changePhoto")}
          >
            <CameraIcon />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        <h2 className="font-display font-extrabold text-2xl mt-4">{user.name}</h2>
        <p className="text-muted text-sm mt-0.5">{user.language}</p>
      </header>

      <section className="px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg">{t("you.account")}</h3>
          {!editing ? (
            <button
              onClick={startEditing}
              className="text-xs font-semibold text-pitch border border-pitch/40 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
            >
              {t("you.edit")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                className="text-xs font-semibold text-muted border border-line rounded-full px-3 py-1.5 active:scale-95 transition-transform"
              >
                {t("you.cancel")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs font-semibold text-ink bg-pitch rounded-full px-4 py-1.5 active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving ? t("you.saving") : t("you.save")}
              </button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-2xl divide-y divide-line">
          <Field label={t("you.name")} htmlFor="profile-name">
            {editing ? (
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-right text-text outline-none"
              />
            ) : (
              <span className="text-text">{user.name}</span>
            )}
          </Field>

          <Field label={t("you.password")} htmlFor="profile-password">
            {editing ? (
              <input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("you.passwordKeep")}
                className="w-full bg-transparent text-right text-text outline-none placeholder:text-muted/50 placeholder:text-xs"
              />
            ) : (
              <span className="text-text tracking-widest" aria-label={t("you.passwordHidden")}>
                ••••••••
              </span>
            )}
          </Field>

          <Field label={t("you.language")} htmlFor="profile-language">
            {editing ? (
              <select
                id="profile-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-right text-text outline-none appearance-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name} className="bg-ink">
                    {l.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-text">{user.language}</span>
            )}
          </Field>
        </div>

        {error && (
          <p className="text-live text-sm mt-3" role="alert">
            {error}
          </p>
        )}

        {mode === "local" && (
          <p className="text-muted/60 text-[11px] mt-3 leading-relaxed">
            {t("you.demoNote")}
          </p>
        )}
      </section>

      {current && (
        <section className="px-5 pb-2">
          <div className="bg-surface border border-line rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-pitch uppercase tracking-wider">
              {t("you.currentMatch")}
            </p>
            {currentMatch ? (
              <div className="flex items-center gap-2 mt-1.5 font-semibold">
                <span>{currentMatch.homeFlag}</span>
                <span>{currentMatch.home}</span>
                <span className="text-muted text-sm mx-1">{t("common.vs")}</span>
                <span>{currentMatch.awayFlag}</span>
                <span>{currentMatch.away}</span>
              </div>
            ) : (
              <p className="mt-1.5 font-semibold">
                {STADIUM_BY_KEY[current.stadiumKey]?.name || current.stadiumKey}
              </p>
            )}
            <button
              onClick={recordCurrent}
              disabled={alreadyRecorded}
              className="mt-3 w-full font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-100 bg-pitch text-ink disabled:bg-elevated disabled:text-muted disabled:border disabled:border-line"
            >
              {alreadyRecorded ? t("you.attendedDone") : t("you.attendThis")}
            </button>
          </div>
        </section>
      )}

      <section className="px-5 pb-6 pt-4">
        <h3 className="font-display font-bold text-lg mb-3">{t("you.attended")}</h3>
        {visits.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-6 text-center">
            <p className="text-muted text-sm">{t("you.attendedEmpty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => {
              const stadium = STADIUM_BY_KEY[v.stadiumKey];
              const m = v.match;
              return (
                <div key={v.id} className="bg-surface border border-line rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-pitch uppercase tracking-wider">
                      {m ? m.stage : t("you.visit")}
                    </span>
                    {m?.score && <span className="font-display font-extrabold">{m.score}</span>}
                  </div>

                  {m ? (
                    <div className="flex items-center gap-2 mt-2 font-semibold">
                      <span>{m.homeFlag}</span>
                      <span>{m.home}</span>
                      <span className="text-muted text-sm mx-1">{t("common.vs")}</span>
                      <span>{m.awayFlag}</span>
                      <span>{m.away}</span>
                    </div>
                  ) : (
                    <p className="mt-2 font-semibold">{stadium ? stadium.name : v.stadiumKey}</p>
                  )}

                  <p className="text-muted text-[11px] mt-2">
                    {[
                      // With a match, the teams are the headline, so show the full
                      // stadium here. Without one, the name is already the headline,
                      // so show just the city to avoid repeating it.
                      stadium ? (m ? `${stadium.name} - ${stadium.city}` : stadium.city) : null,
                      v.date,
                      v.seat ? t("you.seatLabel", { seat: v.seat }) : null,
                    ]
                      .filter(Boolean)
                      .join("  \u00b7  ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="px-5 pb-8">
        <button
          onClick={handleSignOut}
          className="w-full bg-elevated border border-line text-live font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform"
        >
          {t("you.signOut")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-4">
      <label className="text-sm text-muted shrink-0" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="flex-1 min-w-0 text-right">{children}</div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B0E13" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}