import { describe, expect, it } from "vitest";
import { formatEnergyValue, formatNumber, formatPercentage, getLocale } from "../src/utils/format";
import type { HomeAssistant } from "../src/types";

describe("format utils", () => {
  it("prefers configured locale over hass locale", () => {
    const hass = {
      states: {},
      locale: { language: "de-DE" }
    } as HomeAssistant;

    expect(getLocale(hass, "en-US")).toBe("en-US");
    expect(getLocale(hass)).toBe("de-DE");
    expect(getLocale(undefined)).toBe("en");
  });

  it("formats numbers and energy values with locale-aware separators", () => {
    expect(formatNumber(1234.56, "de-DE", 1)).toBe("1.234,6");
    expect(formatEnergyValue(12.34, "kWh", "en-US", 2)).toBe("12.34 kWh");
  });

  it("formats percentages with adaptive precision", () => {
    expect(formatPercentage(9.94, "en-US")).toBe("9.9");
    expect(formatPercentage(10.2, "en-US")).toBe("10");
  });
});
