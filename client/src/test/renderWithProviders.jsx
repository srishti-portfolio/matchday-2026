import { render } from "@testing-library/react";
import { I18nProvider } from "../i18n/I18nContext.jsx";

/**
 * Render a component inside the providers it needs. Defaults to English so
 * assertions can use English text; pass `language` to test another locale.
 * @param {React.ReactNode} ui
 * @param {{ language?: string }} [options]
 */
export function renderWithI18n(ui, { language = "English" } = {}) {
  return render(<I18nProvider language={language}>{ui}</I18nProvider>);
}
