import { describe, expect, it } from "vitest";
import { getPeriodRange, isCurrentOpenPeriod } from "../src/utils/period";

describe("period utils", () => {
  const now = new Date("2026-04-04T13:45:12.000Z");
  const entities = ["sensor.a", "sensor.b"];

  const pickLocalParts = (value: Date) => ({
    year: value.getFullYear(),
    month: value.getMonth(),
    day: value.getDate(),
    hours: value.getHours(),
    minutes: value.getMinutes(),
    seconds: value.getSeconds(),
    milliseconds: value.getMilliseconds()
  });

  it("builds the current day range", () => {
    const range = getPeriodRange("day", 0, now, entities);

    expect(pickLocalParts(range.start)).toEqual({
      year: 2026,
      month: 3,
      day: 4,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    });
    expect(pickLocalParts(range.end)).toEqual({
      year: 2026,
      month: 3,
      day: 5,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    });
    expect(range.key).toBe("day:0:sensor.a,sensor.b");
  });

  it("builds past month and year ranges", () => {
    const monthRange = getPeriodRange("month", 2, now, entities);
    const yearRange = getPeriodRange("year", 1, now, entities);

    expect(pickLocalParts(monthRange.start)).toMatchObject({ year: 2026, month: 1, day: 1, hours: 0 });
    expect(pickLocalParts(monthRange.end)).toMatchObject({ year: 2026, month: 2, day: 1, hours: 0 });
    expect(pickLocalParts(yearRange.start)).toMatchObject({ year: 2025, month: 0, day: 1, hours: 0 });
    expect(pickLocalParts(yearRange.end)).toMatchObject({ year: 2026, month: 0, day: 1, hours: 0 });
  });

  it("treats only offset zero as the current open period", () => {
    expect(isCurrentOpenPeriod(0)).toBe(true);
    expect(isCurrentOpenPeriod(1)).toBe(false);
  });
});
