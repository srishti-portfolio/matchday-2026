import { useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useT } from "../i18n/I18nContext.jsx";
import { LANGUAGES } from "../data.js";

/**
 * @param {object} props
 * @param {string} props.language currently previewed language (drives the whole UI)
 * @param {(lang: string) => void} props.onLanguageChange
 */
export default function AuthScreen({ language, onLanguageChange }) {
  const { signIn, signUp } = useUser();
  const t = useT();

  const [mode, setMode] = useState("create");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignInHint, setShowSignInHint] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setShowSignInHint(false);
    if (!name.trim() || !password.trim()) {
      setError(t("auth.errorEmpty"));
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "create"
          ? await signUp({ name: name.trim(), password, language })
          : await signIn({ name: name.trim(), password });
      if (!res.ok) {
        setError(res.error || t("auth.errorGeneric"));
        if (res.code === "exists") setShowSignInHint(true);
      }
    } finally {
      setBusy(false);
    }
  }

  function switchToSignIn() {
    setMode("signin");
    setError("");
    setShowSignInHint(false);
    // keep the name they typed
  }

  return (
    <main className="floodlit min-h-[100dvh] flex flex-col">
      <header className="px-6 pt-14 pb-8">
        <div className="flex items-center gap-2 text-pitch text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-live animate-pulseLive" />
          {t("auth.eyebrow")}
        </div>
        <h1 className="font-display font-black text-5xl leading-[0.95] mt-4 tracking-tight">
          MATCH<span className="text-pitch">DAY</span>
        </h1>
        <p className="text-muted mt-3 text-[15px] leading-relaxed max-w-[300px]">
          {t("app.tagline")}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-auto bg-surface border-t border-line rounded-t-3xl px-6 pt-6 pb-10 animate-fadeUp"
      >
        <div className="flex bg-ink rounded-full p-1 mb-6 border border-line">
          {[
            { id: "create", key: "auth.createAccount" },
            { id: "signin", key: "auth.signIn" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                mode === tab.id ? "bg-pitch text-ink" : "text-muted"
              }`}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>

        <label
          htmlFor="auth-name"
          className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
        >
          {t("auth.name")}
        </label>
        <input
          id="auth-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("auth.namePlaceholder")}
          className="w-full bg-ink border border-line rounded-xl px-4 py-3 mb-4 text-text placeholder:text-muted/60 focus:border-pitch outline-none transition-colors"
        />

        <label
          htmlFor="auth-password"
          className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
        >
          {t("auth.password")}
        </label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            mode === "create" ? t("auth.passwordPlaceholder") : t("auth.passwordSignInPlaceholder")
          }
          className="w-full bg-ink border border-line rounded-xl px-4 py-3 mb-4 text-text placeholder:text-muted/60 focus:border-pitch outline-none transition-colors"
        />

        {mode === "create" && (
          <>
            <label
              htmlFor="auth-language"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
            >
              {t("auth.language")}
            </label>
            <select
              id="auth-language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full bg-ink border border-line rounded-xl px-4 py-3 text-text focus:border-pitch outline-none transition-colors appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.native} - {l.name}
                </option>
              ))}
            </select>
            <p className="text-muted/60 text-[11px] mt-1.5 mb-4">{t("auth.languageHint")}</p>
          </>
        )}

        {error && (
          <div className="mb-4 -mt-1" role="alert" aria-live="polite">
            <p className="text-live text-sm">{error}</p>
            {showSignInHint && (
              <button
                type="button"
                onClick={switchToSignIn}
                className="mt-2 text-sm font-semibold text-pitch underline underline-offset-2"
              >
                {t("auth.signInInstead")}
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-pitch text-ink font-display font-extrabold text-lg py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {busy ? t("auth.busy") : mode === "create" ? t("auth.createAccount") : t("auth.signIn")}
        </button>
      </form>
    </main>
  );
}
