import { LANGUAGE_TO_CODE } from "./strings.js";

/** code -> display name, e.g. "es" -> "Spanish". */
const CODE_TO_LANGUAGE = Object.fromEntries(
  Object.entries(LANGUAGE_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Best-guess starting language from the browser, used before sign-in.
 * Falls back to English for anything we don't support.
 * @returns {string} a display name from data.js LANGUAGES, e.g. "Spanish"
 */
export function detectLanguage() {
  if (typeof navigator === "undefined") return "English";

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    if (!tag) continue;
    const base = String(tag).toLowerCase().split("-")[0]; // "es-MX" -> "es"
    if (CODE_TO_LANGUAGE[base]) return CODE_TO_LANGUAGE[base];
  }
  return "English";
}
