import { createContext, useCallback, useContext, useMemo } from "react";
import { STRINGS, LANGUAGE_TO_CODE, RTL_LANGUAGES } from "./strings.js";

/**
 * App-wide translation layer.
 *
 * The user's language (chosen at sign-up, editable in the You tab) drives every
 * label in the UI. Lookups fall back to English when a key is missing, so a
 * partially-translated locale degrades gracefully instead of showing blanks.
 */

const I18nContext = createContext(null);

/**
 * Resolve a dotted key against a locale, e.g. "auth.signIn".
 * @param {object} table
 * @param {string} key
 * @returns {string|undefined}
 */
function lookup(table, key) {
  return key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), table);
}

/**
 * Replace {placeholders} with values.
 * @param {string} template
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

export function I18nProvider({ language = "English", children }) {
  const code = LANGUAGE_TO_CODE[language] || "en";
  const isRtl = RTL_LANGUAGES.has(code);

  /**
   * Translate a key.
   * @param {string} key dotted path, e.g. "tabs.home"
   * @param {Record<string, string|number>} [vars] values for {placeholders}
   * @returns {string}
   */
  const t = useCallback(
    (key, vars) => {
      const value = lookup(STRINGS[code], key) ?? lookup(STRINGS.en, key);
      if (value === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
        return key; // visible in dev, harmless in prod
      }
      return interpolate(value, vars);
    },
    [code]
  );

  const value = useMemo(() => ({ t, code, language, isRtl }), [t, code, language, isRtl]);

  return (
    <I18nContext.Provider value={value}>
      <div dir={isRtl ? "rtl" : "ltr"} lang={code}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

/**
 * @returns {(key: string, vars?: Record<string, string|number>) => string}
 */
export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx.t;
}

/** Full i18n context: { t, code, language, isRtl }. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
