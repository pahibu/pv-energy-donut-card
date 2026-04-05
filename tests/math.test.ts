import { describe, expect, it } from "vitest";
import { calculatePercentages, clamp, roundTo } from "../src/utils/math";

describe("math utils", () => {
  it("clamps values into the provided range", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("rounds values to the requested precision", () => {
    expect(roundTo(1.234, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
  });

  it("calculates percentages from positive values", () => {
    expect(calculatePercentages([2, 3, 5])).toEqual([20, 30, 50]);
  });

  it("returns zero percentages when the total is not positive", () => {
    expect(calculatePercentages([0, 0, 0])).toEqual([0, 0, 0]);
    expect(calculatePercentages([-1, 1])).toEqual([0, 0]);
  });
});
