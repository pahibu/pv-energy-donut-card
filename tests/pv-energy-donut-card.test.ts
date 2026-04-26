// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";
import "../src/pv-energy-donut-card";
import type { LovelaceCard } from "../src/types";

const createCard = (): LovelaceCard => document.createElement("pv-energy-donut-card") as LovelaceCard;

describe("pv-energy-donut-card config tokens", () => {
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

  it("defaults to balanced ring size for missing or unsupported values", () => {
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

    expect(card.style.getPropertyValue("--pv-chart-cutout")).toBe("76");

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      ring_size: "something-else" as "balanced",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-cutout")).toBe("76");
  });

  it("applies airy ring size tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      ring_size: "airy",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-cutout")).toBe("82");
  });

  it("applies thin ring size tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      ring_size: "thin",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-cutout")).toBe("88");
  });

  it("applies bold ring size tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      ring_size: "bold",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-chart-cutout")).toBe("68");
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
