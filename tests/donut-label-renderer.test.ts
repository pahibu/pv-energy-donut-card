import type { Chart } from "chart.js";
import { describe, expect, it } from "vitest";
import { DonutConnectorLabelRenderer } from "../src/chart/donut-label-renderer";

const renderLabel = (dpr: number, active: boolean, descent: number) => {
  const lines: number[] = [];
  const inkBottoms: number[] = [];
  const stack: { baseline: string; y: number; scale: number }[] = [];
  let y = 0;
  let scale = 1;
  const context = {
    textBaseline: "middle",
    save() { stack.push({ baseline: this.textBaseline, y, scale }); },
    restore() {
      const state = stack.pop()!;
      this.textBaseline = state.baseline;
      y = state.y;
      scale = state.scale;
    },
    measureText() {
      return { width: 30, actualBoundingBoxDescent: this.textBaseline === "alphabetic" ? descent : -4 };
    },
    beginPath() {},
    moveTo(_x: number, lineY: number) { lines.push(lineY); },
    lineTo() {},
    stroke() {},
    translate(_x: number, offset: number) { y += offset; },
    scale(_x: number, factor: number) { scale *= factor; },
    fillText(_text: string, _x: number, textY: number) {
      if (this.textBaseline === "alphabetic") inkBottoms.push(y + (textY + descent) * scale);
    }
  };
  const chart = { width: 406, currentDevicePixelRatio: dpr } as Chart<"doughnut">;
  const renderer = new DonutConnectorLabelRenderer(chart, { locale: "en", data: [], textColor: "#fff" });
  const styles = { getPropertyValue: () => "" } as unknown as CSSStyleDeclaration;
  const typography = DonutConnectorLabelRenderer.resolveTypography(styles, 70);
  renderer["drawLabel"](
    context as unknown as CanvasRenderingContext2D,
    { active, color: "#58d68d", valueText: "5.7 kWh", labelText: "Solar", percentageText: "46%",
      side: "left", anchorX: 120, anchorY: 120, labelTopY: 100 },
    typography, "#fff", "#aaa", 203, styles
  );
  return { lineY: lines[0], inkBottoms, lineWidth: typography.lineWidth + (active ? 0.5 : 0) };
};

describe("high-DPR label clearance", () => {
  for (const dpr of [2, 3]) {
    for (const active of [false, true]) {
      for (const descent of [0, 2, 8]) {
        it(`keeps text above the stroke at DPR ${dpr}, active=${active}, descent=${descent}`, () => {
          const result = renderLabel(dpr, active, descent);
          expect(result.lineY).toBe(renderLabel(1, active, descent).lineY);
          for (const bottom of result.inkBottoms) {
            expect(result.lineY - result.lineWidth / 2 - bottom).toBeGreaterThanOrEqual(3 - 1e-8);
          }
          expect(result.inkBottoms).toHaveLength(2);
        });
      }
    }
  }
});
