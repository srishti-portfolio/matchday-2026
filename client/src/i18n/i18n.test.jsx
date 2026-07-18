import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { STRINGS, LANGUAGE_TO_CODE, RTL_LANGUAGES } from "./strings.js";
import { detectLanguage } from "./detect.js";
import { renderWithI18n } from "../test/renderWithProviders.jsx";
import { useT, useI18n } from "./I18nContext.jsx";
import { LANGUAGES } from "../data.js";

/** Flatten a nested strings object into dotted keys. */
function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

describe("string tables", () => {
  const enKeys = flatten(STRINGS.en).sort();

  it("covers every language offered in the sign-up list", () => {
    for (const lang of LANGUAGES) {
      const code = LANGUAGE_TO_CODE[lang.name];
      expect(code, `${lang.name} has no locale code`).toBeTruthy();
      expect(STRINGS[code], `${lang.name} (${code}) has no strings`).toBeTruthy();
    }
  });

  it.each(Object.keys(STRINGS))("%s has every key English has", (code) => {
    expect(flatten(STRINGS[code]).sort()).toEqual(enKeys);
  });

  it.each(Object.keys(STRINGS))("%s has no empty strings", (code) => {
    for (const key of flatten(STRINGS[code])) {
      const value = key.split(".").reduce((a, p) => a[p], STRINGS[code]);
      expect(value.trim(), `${code}.${key} is empty`).not.toBe("");
    }
  });

  it("keeps placeholders consistent with English", () => {
    const placeholders = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(",");
    for (const key of enKeys) {
      const en = key.split(".").reduce((a, p) => a[p], STRINGS.en);
      const want = placeholders(en);
      if (!want) continue;
      for (const code of Object.keys(STRINGS)) {
        const got = placeholders(key.split(".").reduce((a, p) => a[p], STRINGS[code]));
        expect(got, `${code}.${key} placeholders differ from English`).toBe(want);
      }
    }
  });
});

function Probe() {
  const t = useT();
  return (
    <>
      <span data-testid="plain">{t("tabs.home")}</span>
      <span data-testid="interp">{t("home.seat", { seat: "114" })}</span>
      <span data-testid="missing">{t("nope.not.here")}</span>
    </>
  );
}

describe("useT", () => {
  it("returns English by default", () => {
    renderWithI18n(<Probe />);
    expect(screen.getByTestId("plain")).toHaveTextContent("Home");
  });

  it("translates when the language changes", () => {
    renderWithI18n(<Probe />, { language: "Spanish" });
    expect(screen.getByTestId("plain")).toHaveTextContent("Inicio");
  });

  it("interpolates placeholders", () => {
    renderWithI18n(<Probe />, { language: "Spanish" });
    expect(screen.getByTestId("interp")).toHaveTextContent("Asiento 114");
  });

  it("returns the key for a missing string rather than crashing", () => {
    renderWithI18n(<Probe />);
    expect(screen.getByTestId("missing")).toHaveTextContent("nope.not.here");
  });

  it("falls back to English for an unknown language", () => {
    renderWithI18n(<Probe />, { language: "Klingon" });
    expect(screen.getByTestId("plain")).toHaveTextContent("Home");
  });
});

function DirProbe() {
  const { isRtl, code } = useI18n();
  return <span data-testid="dir">{`${code}:${isRtl}`}</span>;
}

describe("direction", () => {
  it("marks Arabic as right-to-left", () => {
    renderWithI18n(<DirProbe />, { language: "Arabic" });
    expect(screen.getByTestId("dir")).toHaveTextContent("ar:true");
  });

  it("marks English as left-to-right", () => {
    renderWithI18n(<DirProbe />, { language: "English" });
    expect(screen.getByTestId("dir")).toHaveTextContent("en:false");
  });

  it("only Arabic is RTL in this set", () => {
    expect([...RTL_LANGUAGES]).toEqual(["ar"]);
  });
});

describe("detectLanguage", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "languages");

  function setLanguages(value) {
    Object.defineProperty(navigator, "languages", { value, configurable: true });
  }

  afterEach(() => {
    if (original) Object.defineProperty(navigator, "languages", original);
  });

  it("matches a regional tag to its base language", () => {
    setLanguages(["es-MX"]);
    expect(detectLanguage()).toBe("Spanish");
  });

  it("falls back to English for unsupported languages", () => {
    setLanguages(["sw-KE"]);
    expect(detectLanguage()).toBe("English");
  });

  it("takes the first supported language in the list", () => {
    setLanguages(["sw-KE", "ja-JP", "fr-FR"]);
    expect(detectLanguage()).toBe("Japanese");
  });
});
