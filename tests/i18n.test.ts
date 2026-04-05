import { describe, expect, it } from "vitest";
import { formatHistoryRequestFailed, getLanguageFromLocale, getTranslations } from "../src/i18n";

describe("i18n", () => {
  it("maps locales to supported languages", () => {
    expect(getLanguageFromLocale("de-DE")).toBe("de");
    expect(getLanguageFromLocale("de-AT")).toBe("de");
    expect(getLanguageFromLocale("en-US")).toBe("en");
    expect(getLanguageFromLocale(undefined)).toBe("en");
  });

  it("returns translated UI copy", () => {
    expect(getTranslations("de-DE").production).toBe("Produktion");
    expect(getTranslations("en-US").production).toBe("Production");
  });

  it("formats localized history errors", () => {
    expect(formatHistoryRequestFailed(500, "de-DE")).toBe("Verlaufsanfrage fehlgeschlagen (500)");
    expect(formatHistoryRequestFailed(500, "en-US")).toBe("History request failed (500)");
  });
});
