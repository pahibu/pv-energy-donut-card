import "../../dist/pv-energy-donut-card.js";
import { visualScenarios } from "./scenarios.mjs";

if (!customElements.get("ha-card")) {
  customElements.define("ha-card", class extends HTMLElement {});
}

const FIXED_NOW = "2026-04-01T12:00:00.000Z";
const stage = document.querySelector("[data-stage]");
const params = new URLSearchParams(window.location.search);
const scenarioName = params.get("scenario") ?? "simple-default";
const scenario = visualScenarios[scenarioName];

window.__PV_VISUAL_READY__ = false;
window.__PV_VISUAL_TARGET__ = "[data-visual-root]";
window.__PV_VISUAL_SCENARIO__ = scenarioName;

if (!scenario) {
  throw new Error(`Unknown visual scenario: ${scenarioName}`);
}

const createState = (entityId, value) => ({
  entity_id: entityId,
  state: String(value),
  attributes: {}
});

const buildStates = (stateValues) =>
  Object.fromEntries(Object.entries(stateValues).map(([entityId, value]) => [entityId, createState(entityId, value)]));

const getPreviewPeriodMultiplier = (startDate, endDate) => {
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const fixedNow = new Date(FIXED_NOW);
  const ageDays = Math.max(0, Math.round((fixedNow.getTime() - endDate.getTime()) / 86400000));
  const periodBase = durationDays >= 360 ? 28 : durationDays >= 28 ? 5.4 : 1;
  const ageFactor = Math.max(0.42, 1 - ageDays * 0.035);
  return Number((periodBase * ageFactor).toFixed(3));
};

const buildStatisticsResult = (message, stateValues) => {
  const startDate = new Date(String(message.start_time ?? FIXED_NOW));
  const endDate = new Date(String(message.end_time ?? startDate.toISOString()));
  const statisticIds = Array.isArray(message.statistic_ids) ? message.statistic_ids : [];
  const period = message.period === "month" || message.period === "day" || message.period === "hour" ? message.period : "hour";
  const multiplier = getPreviewPeriodMultiplier(startDate, endDate);
  const segmentCount = Math.max(
    1,
    period === "month"
      ? Math.round((endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()))
      : period === "day"
        ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
        : Math.round((endDate.getTime() - startDate.getTime()) / 3600000)
  );

  return Object.fromEntries(
    statisticIds.map((entityId) => {
      const total = Number(((stateValues[entityId] ?? 0) * multiplier).toFixed(3));
      const perStepChange = Number((total / segmentCount).toFixed(3));
      let runningTotal = 0;

      const rows = Array.from({ length: segmentCount }, (_, index) => {
        runningTotal = Number((runningTotal + perStepChange).toFixed(3));
        return {
          start: new Date(startDate.getTime() + index * ((endDate.getTime() - startDate.getTime()) / segmentCount)).toISOString(),
          end: new Date(startDate.getTime() + (index + 1) * ((endDate.getTime() - startDate.getTime()) / segmentCount)).toISOString(),
          change: perStepChange,
          sum: runningTotal,
          state: runningTotal
        };
      });

      return [entityId, rows];
    })
  );
};

const createPreviewHass = (locale, stateValues) => ({
  locale: {
    language: locale
  },
  states: buildStates(stateValues),
  callWS: async (message) => {
    if (message?.type === "recorder/statistics_during_period") {
      return buildStatisticsResult(message, stateValues);
    }

    throw new Error(`Unsupported preview callWS message: ${String(message?.type ?? "unknown")}`);
  }
});

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (requestUrl.startsWith("/api/history/period/")) {
    const parsedUrl = new URL(requestUrl, window.location.origin);
    const startIso = decodeURIComponent(requestUrl.split("/api/history/period/")[1].split("?")[0] || "");
    const endIso = parsedUrl.searchParams.get("end_time");
    const filterEntityId = parsedUrl.searchParams.get("filter_entity_id") ?? "";
    const entityIds = filterEntityId.split(",").filter(Boolean);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso ?? startIso);
    const multiplier = getPreviewPeriodMultiplier(startDate, endDate);

    const payload = entityIds.map((entityId) => {
      const total = Number((((scenario.stateValues[entityId] ?? 0) * multiplier)).toFixed(3));
      return [
        {
          entity_id: entityId,
          state: "0",
          last_changed: startDate.toISOString(),
          last_updated: startDate.toISOString()
        },
        {
          entity_id: entityId,
          state: String(total),
          last_changed: endDate.toISOString(),
          last_updated: endDate.toISOString()
        }
      ];
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  return realFetch(input, init);
};

const waitForPaint = async () => {
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
};

const renderScenario = async () => {
  document.documentElement.style.setProperty("--visual-card-width", `${scenario.cardWidth}px`);
  const card = document.createElement("pv-energy-donut-card");
  card.setAttribute("preview-theme", "");
  card.setAttribute("data-visual-root", "");

  for (const [property, value] of Object.entries(scenario.theme)) {
    card.style.setProperty(property, value);
  }

  card.setConfig(structuredClone(scenario.config));
  card.hass = createPreviewHass(scenario.locale, scenario.stateValues);
  stage.replaceChildren(card);

  await card.updateComplete;
  await waitForPaint();
  await card.updateComplete;

  if (scenario.config.mode === "time_navigator") {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    await card.updateComplete;
    await waitForPaint();
  }

  window.__PV_VISUAL_READY__ = true;
};

void renderScenario();
