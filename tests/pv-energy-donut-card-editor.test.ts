// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";
import "../src/pv-energy-donut-card-editor";
import type { HomeAssistant, LovelaceCardEditor } from "../src/types";

type EditorElement = LovelaceCardEditor & HTMLElement;

const createEditor = (): EditorElement => document.createElement("pv-energy-donut-card-editor") as EditorElement;

const createHass = (language: string): HomeAssistant => ({
  states: {},
  locale: {
    language
  }
});

const getSpacingSelect = (editor: EditorElement): HTMLSelectElement | null => {
  const selects = Array.from(editor.shadowRoot?.querySelectorAll("select") ?? []);
  return (
    selects.find((select) =>
      ["relaxed", "compact", "none"].every((value) =>
        Array.from(select.querySelectorAll("option")).some((option) => option.value === value)
      )
    ) ?? null
  );
};

const waitForEditorRender = async (editor: EditorElement) => {
  await (editor as EditorElement & { updateComplete?: Promise<unknown> }).updateComplete;
};

describe("pv-energy-donut-card-editor", () => {
  beforeAll(() => {
    if (!customElements.get("ha-entity-picker")) {
      customElements.define("ha-entity-picker", class extends HTMLElement {});
    }
  });

  it("defaults unknown spacing values to relaxed", async () => {
    const editor = createEditor();
    editor.setConfig?.({
      type: "custom:pv-energy-donut-card",
      segment_spacing: "invalid",
      charts: [
        {
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });
    document.body.append(editor);
    await waitForEditorRender(editor);

    const spacingSelect = getSpacingSelect(editor);
    expect(spacingSelect?.value).toBe("relaxed");
    editor.remove();
  });

  it("emits config-changed when segment spacing is updated", async () => {
    const editor = createEditor();
    editor.hass = createHass("en-US");
    editor.setConfig?.({
      type: "custom:pv-energy-donut-card",
      segment_spacing: "relaxed",
      charts: [
        {
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });
    document.body.append(editor);
    await waitForEditorRender(editor);

    const emitted: Array<{ segment_spacing?: string }> = [];
    editor.addEventListener("config-changed", ((event: CustomEvent) => {
      emitted.push(event.detail.config);
    }) as EventListener);

    const spacingSelect = getSpacingSelect(editor);
    expect(spacingSelect).toBeDefined();

    spacingSelect.value = "none";
    spacingSelect.dispatchEvent(new Event("change"));

    expect(emitted.at(-1)?.segment_spacing).toBe("none");
    editor.remove();
  });

  it("renders translated spacing labels in German", async () => {
    const editor = createEditor();
    editor.hass = createHass("de-DE");
    editor.setConfig?.({
      type: "custom:pv-energy-donut-card",
      charts: [
        {
          segments: [{ entity: "sensor.feed_in_today" }]
        }
      ]
    });
    document.body.append(editor);
    await waitForEditorRender(editor);

    const text = editor.shadowRoot?.textContent ?? "";
    expect(text).toContain("Segmentabstand");
    expect(text).toContain("Groß");
    expect(text).toContain("Mittel");
    expect(text).toContain("Kein Abstand");
    editor.remove();
  });
});
