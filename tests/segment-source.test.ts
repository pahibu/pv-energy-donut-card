import { describe, expect, it } from "vitest";
import { getSegmentSourceEntity, shouldUseDailyEntity } from "../src/utils/segment-source";

describe("segment source selection", () => {
  it("prefers the daily entity in simple mode", () => {
    expect(
      getSegmentSourceEntity({
        mode: "simple",
        periodUnit: "day",
        periodOffset: 0,
        entity: "sensor.total",
        dailyEntity: "sensor.daily"
      })
    ).toBe("sensor.daily");
  });

  it("uses the daily entity only for today in time navigator mode", () => {
    expect(
      shouldUseDailyEntity({
        mode: "time_navigator",
        periodUnit: "day",
        periodOffset: 0,
        dailyEntity: "sensor.daily"
      })
    ).toBe(true);

    expect(
      shouldUseDailyEntity({
        mode: "time_navigator",
        periodUnit: "day",
        periodOffset: 1,
        dailyEntity: "sensor.daily"
      })
    ).toBe(false);

    expect(
      shouldUseDailyEntity({
        mode: "time_navigator",
        periodUnit: "month",
        periodOffset: 0,
        dailyEntity: "sensor.daily"
      })
    ).toBe(false);
  });

  it("falls back to the cumulative entity when no daily entity is configured", () => {
    expect(
      getSegmentSourceEntity({
        mode: "simple",
        periodUnit: "day",
        periodOffset: 0,
        entity: "sensor.total"
      })
    ).toBe("sensor.total");
  });
});
