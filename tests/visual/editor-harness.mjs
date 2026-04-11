import "../../dist/pv-energy-donut-card.js";
import { visualScenarios } from "./scenarios.mjs";

if (!customElements.get("ha-entity-picker")) {
  customElements.define("ha-entity-picker", class extends HTMLElement {});
}

const stage = document.querySelector("[data-stage]");
const params = new URLSearchParams(window.location.search);
const scenarioName = params.get("scenario") ?? "editor-default";
const scenario = visualScenarios[scenarioName];

window.__PV_VISUAL_READY__ = false;
window.__PV_VISUAL_TARGET__ = "[data-visual-root]";
window.__PV_VISUAL_SCENARIO__ = scenarioName;

if (!scenario) {
  throw new Error(`Unknown visual scenario: ${scenarioName}`);
}

const createStates = () =>
  Object.fromEntries(
    [
      "sensor.feed_in_today",
      "sensor.battery_charge_today",
      "sensor.pv_self_use_today",
      "sensor.grid_import_today",
      "sensor.battery_discharge_today"
    ].map((entityId) => [
      entityId,
      {
        entity_id: entityId,
        state: "0",
        attributes: {}
      }
    ])
  );

const createEditorHass = (locale) => ({
  locale: {
    language: locale
  },
  states: createStates()
});

const waitForPaint = async () => {
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
};

const renderScenario = async () => {
  const editor = document.createElement("pv-energy-donut-card-editor");
  editor.setAttribute("data-visual-root", "");

  for (const [property, value] of Object.entries(scenario.theme ?? {})) {
    editor.style.setProperty(property, value);
  }

  editor.hass = createEditorHass(scenario.locale);
  editor.setConfig(structuredClone(scenario.config));
  stage.replaceChildren(editor);

  await editor.updateComplete;
  await waitForPaint();
  await editor.updateComplete;

  window.__PV_VISUAL_READY__ = true;
};

void renderScenario();
