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

  it("defaults to balanced label preset for missing or unsupported values", () => {
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

    expect(card.style.getPropertyValue("--pv-label-percent-scale")).toBe("1.2");
    expect(card.style.getPropertyValue("--pv-label-percent-weight")).toBe("600");
    expect(card.style.getPropertyValue("--pv-label-value-opacity")).toBe("1");

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_preset: "something-else" as "balanced",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-percent-scale")).toBe("1.2");
    expect(card.style.getPropertyValue("--pv-label-percent-weight")).toBe("600");
    expect(card.style.getPropertyValue("--pv-label-value-opacity")).toBe("1");
  });

  it("defaults to balanced label distance for missing or unsupported values", () => {
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

    expect(card.style.getPropertyValue("--pv-label-distance-max-width")).toBe("600");

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_distance: "something-else" as "balanced",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-distance-max-width")).toBe("600");
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

  it("applies compact label preset tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_preset: "compact",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-percent-scale")).toBe("1.06");
    expect(card.style.getPropertyValue("--pv-label-row-gap-scale")).toBe("0.78");
    expect(card.style.getPropertyValue("--pv-label-collision-gap-min")).toBe("42");
  });

  it("applies minimal label preset tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_preset: "minimal",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-percent-weight")).toBe("550");
    expect(card.style.getPropertyValue("--pv-label-line-width")).toBe("0.75");
    expect(card.style.getPropertyValue("--pv-label-text-opacity")).toBe("0.7");
  });

  it("applies highlight label preset tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_preset: "highlight",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-percent-scale")).toBe("1.34");
    expect(card.style.getPropertyValue("--pv-label-percent-weight")).toBe("700");
    expect(card.style.getPropertyValue("--pv-label-line-width")).toBe("1.25");
  });

  it("applies balanced label distance tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_distance: "balanced",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-distance-max-width")).toBe("600");
  });

  it("applies compact label distance tokens", () => {
    const card = createCard();

    card.setConfig({
      type: "custom:pv-energy-donut-card",
      label_distance: "compact",
      charts: [
        {
          title: "Production",
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });

    expect(card.style.getPropertyValue("--pv-label-distance-max-width")).toBe("520");
  });
});

describe("pv-energy-donut-card layout hooks", () => {
  it("declares Sections auto-height sizing without forcing columns", () => {
    const card = createCard();

    expect(card.getGridOptions()).toEqual({
      rows: "auto"
    });
    expect(card.getLayoutOptions?.()).toEqual({
      grid_rows: "auto"
    });
    expect(card.getGridOptions().columns).toBeUndefined();
    expect(card.getLayoutOptions?.().grid_columns).toBeUndefined();
    expect(card.getGridOptions().min_columns).toBeUndefined();
    expect(card.getGridOptions().max_columns).toBeUndefined();
  });
});
