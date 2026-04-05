import { describe, expect, it } from "vitest";
import { getNumericEntityState } from "../src/utils/ha-state";
import type { HomeAssistant } from "../src/types";

const createHass = (state: string): HomeAssistant => ({
  states: {
    "sensor.energy": {
      entity_id: "sensor.energy",
      state,
      attributes: {}
    }
  }
});

describe("ha state utils", () => {
  it("returns zero without hass or for invalid states", () => {
    expect(getNumericEntityState(undefined, "sensor.energy")).toBe(0);
    expect(getNumericEntityState(createHass("unknown"), "sensor.energy")).toBe(0);
    expect(getNumericEntityState(createHass("unavailable"), "sensor.energy")).toBe(0);
  });

  it("parses positive numeric values", () => {
    expect(getNumericEntityState(createHass("12.5"), "sensor.energy")).toBe(12.5);
  });

  it("clamps negative values to zero", () => {
    expect(getNumericEntityState(createHass("-4"), "sensor.energy")).toBe(0);
  });
});
