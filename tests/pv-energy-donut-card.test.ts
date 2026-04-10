// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";
import "../src/pv-energy-donut-card";
import type { LovelaceCard } from "../src/types";

const createCard = (): LovelaceCard => document.createElement("pv-energy-donut-card") as LovelaceCard;

describe("pv-energy-donut-card spacing config", () => {
  beforeAll(() => {
    if (!customElements.get("ha-card")) {
      customElements.define("ha-card", class extends HTMLElement {});
    }
  });

  it("defaults to relaxed spacing for missing or unsupported values", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-separator-width")).toBe("5");
    expect(card.style.getPropertyValue("--pv-chart-min-segment-separator-factor")).toBe("1.5");

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      segment_spacing: "something-else" as "relaxed",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-separator-width")).toBe("5");
    expect(card.style.getPropertyValue("--pv-chart-min-segment-separator-factor")).toBe("1.5");
  });

  it("applies compact spacing tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      segment_spacing: "compact",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-separator-width")).toBe("3");
    expect(card.style.getPropertyValue("--pv-chart-min-segment-separator-factor")).toBe("1");
  });

  it("applies no-spacing tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      segment_spacing: "none",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-separator-width")).toBe("0");
    expect(card.style.getPropertyValue("--pv-chart-min-segment-separator-factor")).toBe("0");
  });
});
