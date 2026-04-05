import "../dist/pv-energy-donut-card.js";

if (!customElements.get("ha-card")) {
  customElements.define("ha-card", class extends HTMLElement {});
}

const app = document.querySelector("#app");
const controlsRoot = document.querySelector("#controls");
const languageRoot = document.querySelector("#language-switcher");
const themeRoot = document.querySelector("#theme-switcher");
const previewBanner = document.querySelector("[data-preview-banner]");
const previewIntro = document.querySelector("[data-preview-intro]");

const previewSettings = {
  width: 860,
  mode: "simple",
  language: "de",
  theme: "dark"
};

const translations = {
  de: {
    batteryCharge: "Batterieladung",
    batteryDischarge: "Batterieentladung",
    cardMode: "Kartenmodus",
    cardModeLabel: "Modus",
    cardModeSubtitle: "Wechsle zwischen der einfachen Ansicht und dem neuen Zeitnavigator",
    cardTitle: "PV-Energieübersicht",
    cardWidth: "Kartenbreite",
    consumption: "Verbrauch",
    feedIn: "Einspeisung",
    gridImport: "Netzbezug",
    languageLabel: "Sprache",
    themeLabel: "Thema",
    themeDark: "Dunkel",
    themeLight: "Hell",
    modeSimple: "Einfach",
    modeTimeNavigator: "Zeitnavigator",
    previewIntro:
      "Lokale Testseite mit Dummy-Daten. Wenn die Donuts hier korrekt erscheinen, liegt das Problem sehr wahrscheinlich an der Home-Assistant-Ressource oder am Browser-Cache.",
    previewWidth: "Vorschaubreite",
    previewWidthSubtitle: "Simuliere schmale Kartenbreiten wie auf mobilen Geräten",
    production: "Produktion",
    pvSelfConsumption: "PV-Eigenverbrauch",
    sliderSubtitle: "Passe die drei Werte in {unit} live an"
  },
  en: {
    batteryCharge: "Battery charge",
    batteryDischarge: "Battery discharge",
    cardMode: "Card mode",
    cardModeLabel: "Mode",
    cardModeSubtitle: "Switch between the simple view and the new period navigator",
    cardTitle: "PV Energy Overview",
    cardWidth: "Card width",
    consumption: "Consumption",
    feedIn: "Feed-in",
    gridImport: "Grid import",
    languageLabel: "Language",
    themeLabel: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    modeSimple: "Simple",
    modeTimeNavigator: "Time Navigator",
    previewIntro:
      "Local test page with dummy data. If the donuts render correctly here, the problem is very likely caused by the Home Assistant resource or the browser cache.",
    previewWidth: "Preview width",
    previewWidthSubtitle: "Simulate narrow card widths like mobile devices",
    production: "Production",
    pvSelfConsumption: "PV self-consumption",
    sliderSubtitle: "Adjust the three values in {unit} live"
  }
};

const languageFlags = {
  de: "🇩🇪",
  en: "🇬🇧"
};

const themeIcons = {
  light: "☀️",
  dark: "🌙"
};

const themeBanners = {
  light: "./docs/images/banner-light.png",
  dark: "./docs/images/banner-dark.png"
};

const previewThemeTokens = {
  light: {
    "--ha-card-background": "rgba(255, 255, 255, 0.9)",
    "--card-background-color": "rgba(255, 255, 255, 0.9)",
    "--ha-card-border-color": "rgba(85, 112, 136, 0.18)",
    "--divider-color": "rgba(85, 112, 136, 0.18)",
    "--primary-text-color": "#173046",
    "--secondary-text-color": "#587087",
    "--error-color": "#b3261e",
    "--state-error-color": "#b3261e",
    "--ha-card-box-shadow": "0 20px 40px rgba(76, 109, 140, 0.16)"
  },
  dark: {
    "--ha-card-background": "rgba(9, 17, 27, 0.78)",
    "--card-background-color": "rgba(9, 17, 27, 0.78)",
    "--ha-card-border-color": "rgba(158, 176, 196, 0.18)",
    "--divider-color": "rgba(158, 176, 196, 0.18)",
    "--primary-text-color": "#eef4fb",
    "--secondary-text-color": "#9eb0c4",
    "--error-color": "#ff8d8d",
    "--state-error-color": "#ff8d8d",
    "--ha-card-box-shadow": "0 18px 40px rgba(0, 0, 0, 0.18)"
  }
};

const getText = () => translations[previewSettings.language] ?? translations.en;

const createState = (entityId, value) => ({
  entity_id: entityId,
  state: String(value),
  attributes: {}
});

const stateValues = {
  "sensor.preview_feed_in_today": 4.6,
  "sensor.preview_battery_charge_today": 2.1,
  "sensor.preview_pv_self_use_production_today": 5.7,
  "sensor.preview_pv_self_use_consumption_today": 5.7,
  "sensor.preview_battery_discharge_today": 1.9,
  "sensor.preview_grid_import_today": 3.8
};

const buildStates = () =>
  Object.fromEntries(
    Object.entries(stateValues).map(([entityId, value]) => [entityId, createState(entityId, value)])
  );

const buildStatisticsResult = (message) => {
  const startDate = new Date(String(message.start_time ?? new Date().toISOString()));
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

const createPreviewHass = () => ({
  locale: {
    language: previewSettings.language === "de" ? "de-DE" : "en-US"
  },
  states: buildStates(),
  callWS: async (message) => {
    if (message?.type === "recorder/statistics_during_period") {
      return buildStatisticsResult(message);
    }

    throw new Error(`Unsupported preview callWS message: ${String(message?.type ?? "unknown")}`);
  }
});

const hass = createPreviewHass();

const config = {
  type: "custom:pv-energy-donut-card",
  title: "",
  mode: "simple",
  value_precision: 1,
  total_precision: 1,
  charts: [
    {
      key: "production",
      title: "",
      unit: "kWh",
      segments: [
        {
          entity: "sensor.preview_feed_in_today",
          label: "",
          color: "#5dade2"
        },
        {
          entity: "sensor.preview_battery_charge_today",
          label: "",
          color: "#f5b041"
        },
        {
          entity: "sensor.preview_pv_self_use_production_today",
          label: "",
          color: "#58d68d"
        }
      ]
    },
    {
      key: "consumption",
      title: "",
      unit: "kWh",
      segments: [
        {
          entity: "sensor.preview_pv_self_use_consumption_today",
          label: "",
          color: "#58d68d"
        },
        {
          entity: "sensor.preview_battery_discharge_today",
          label: "",
          color: "#af7ac5"
        },
        {
          entity: "sensor.preview_grid_import_today",
          label: "",
          color: "#ec7063"
        }
      ]
    }
  ]
};

let card;

const realFetch = window.fetch.bind(window);

const getPreviewPeriodMultiplier = (startDate, endDate) => {
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const ageDays = Math.max(0, Math.round((Date.now() - endDate.getTime()) / 86400000));
  const periodBase = durationDays >= 360 ? 28 : durationDays >= 28 ? 5.4 : 1;
  const ageFactor = Math.max(0.42, 1 - ageDays * 0.035);
  return Number((periodBase * ageFactor).toFixed(3));
};

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
      const total = Number(((stateValues[entityId] ?? 0) * multiplier).toFixed(3));
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

const applyPreviewWidth = () => {
  app?.style.setProperty("--preview-width", `${previewSettings.width}px`);
};

const applyLocalizedConfig = () => {
  const text = getText();

  config.title = text.cardTitle;
  config.charts[0].title = text.production;
  config.charts[0].segments[0].label = text.feedIn;
  config.charts[0].segments[1].label = text.batteryCharge;
  config.charts[0].segments[2].label = text.pvSelfConsumption;
  config.charts[1].title = text.consumption;
  config.charts[1].segments[0].label = text.pvSelfConsumption;
  config.charts[1].segments[1].label = text.batteryDischarge;
  config.charts[1].segments[2].label = text.gridImport;
};

const applyPageCopy = () => {
  const text = getText();
  document.documentElement.lang = previewSettings.language;
  document.documentElement.dataset.theme = previewSettings.theme;
  if (previewBanner) {
    previewBanner.setAttribute("src", themeBanners[previewSettings.theme]);
  }
  if (previewIntro) {
    previewIntro.textContent = text.previewIntro;
  }
};

const renderCard = () => {
  applyLocalizedConfig();
  const nextCard = document.createElement("pv-energy-donut-card");
  nextCard.setAttribute("preview-theme", "");
  for (const [property, value] of Object.entries(previewThemeTokens[previewSettings.theme])) {
    nextCard.style.setProperty(property, value);
  }
  config.mode = previewSettings.mode;
  nextCard.setConfig(config);
  nextCard.hass = createPreviewHass();
  const stage = document.createElement("div");
  stage.className = "preview-stage";
  stage.append(nextCard);
  app.replaceChildren(stage);
  card = nextCard;
  applyPreviewWidth();
};

renderCard();

const getSliderGroups = () => {
  const text = getText();

  return [
    {
      title: text.production,
      unit: "kWh",
      sliders: [
        {
          entity: "sensor.preview_feed_in_today",
          label: text.feedIn,
          color: "#5dade2",
          min: 0,
          max: 15,
          step: 0.1
        },
        {
          entity: "sensor.preview_battery_charge_today",
          label: text.batteryCharge,
          color: "#f5b041",
          min: 0,
          max: 15,
          step: 0.1
        },
        {
          entity: "sensor.preview_pv_self_use_production_today",
          label: text.pvSelfConsumption,
          color: "#58d68d",
          min: 0,
          max: 15,
          step: 0.1
        }
      ]
    },
    {
      title: text.consumption,
      unit: "kWh",
      sliders: [
        {
          entity: "sensor.preview_pv_self_use_consumption_today",
          label: text.pvSelfConsumption,
          color: "#58d68d",
          min: 0,
          max: 15,
          step: 0.1
        },
        {
          entity: "sensor.preview_battery_discharge_today",
          label: text.batteryDischarge,
          color: "#af7ac5",
          min: 0,
          max: 15,
          step: 0.1
        },
        {
          entity: "sensor.preview_grid_import_today",
          label: text.gridImport,
          color: "#ec7063",
          min: 0,
          max: 15,
          step: 0.1
        }
      ]
    }
  ];
};

const updateCard = () => {
  hass.states = buildStates();
  renderCard();
};

const formatValue = (value) => `${value.toFixed(1)} kWh`;

const createSlider = ({ entity, label, color, min, max, step }) => {
  const row = document.createElement("label");
  row.className = "control-row";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = label;

  const value = document.createElement("output");
  value.className = "control-value";
  value.value = String(stateValues[entity]);
  value.textContent = formatValue(stateValues[entity]);

  const input = document.createElement("input");
  input.className = "control-slider";
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(stateValues[entity]);
  input.style.setProperty("--accent", color);

  input.addEventListener("input", () => {
    const nextValue = Number.parseFloat(input.value);
    stateValues[entity] = Number.isFinite(nextValue) ? nextValue : 0;
    value.value = String(stateValues[entity]);
    value.textContent = formatValue(stateValues[entity]);
    updateCard();
  });

  row.append(title, value, input);
  return row;
};

const createPreviewWidthControl = () => {
  const text = getText();
  const section = document.createElement("section");
  section.className = "control-panel";

  const heading = document.createElement("div");
  heading.className = "control-panel-heading";
  heading.textContent = text.previewWidth;

  const subtitle = document.createElement("div");
  subtitle.className = "control-panel-subtitle";
  subtitle.textContent = text.previewWidthSubtitle;

  const row = document.createElement("label");
  row.className = "control-row";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = text.cardWidth;

  const value = document.createElement("output");
  value.className = "control-value";
  value.value = String(previewSettings.width);
  value.textContent = `${previewSettings.width}px`;

  const input = document.createElement("input");
  input.className = "control-slider";
  input.type = "range";
  input.min = "320";
  input.max = "1200";
  input.step = "10";
  input.value = String(previewSettings.width);
  input.style.setProperty("--accent", "#7fc8ff");

  input.addEventListener("input", () => {
    const nextWidth = Number.parseInt(input.value, 10);
    previewSettings.width = Number.isFinite(nextWidth) ? nextWidth : 860;
    value.value = String(previewSettings.width);
    value.textContent = `${previewSettings.width}px`;
    applyPreviewWidth();
  });

  row.append(title, value, input);
  section.append(heading, subtitle, row);
  return section;
};

const createModeControl = () => {
  const text = getText();
  const section = document.createElement("section");
  section.className = "control-panel";

  const heading = document.createElement("div");
  heading.className = "control-panel-heading";
  heading.textContent = text.cardMode;

  const subtitle = document.createElement("div");
  subtitle.className = "control-panel-subtitle";
  subtitle.textContent = text.cardModeSubtitle;

  const row = document.createElement("label");
  row.className = "control-row";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = text.cardModeLabel;

  const select = document.createElement("select");
  select.className = "control-slider";
  select.style.setProperty("--accent", "#7fc8ff");

  const simpleOption = document.createElement("option");
  simpleOption.value = "simple";
  simpleOption.textContent = text.modeSimple;

  const periodOption = document.createElement("option");
  periodOption.value = "time_navigator";
  periodOption.textContent = text.modeTimeNavigator;

  select.append(simpleOption, periodOption);
  select.value = previewSettings.mode;
  select.addEventListener("change", () => {
    previewSettings.mode = select.value === "time_navigator" ? "time_navigator" : "simple";
    updateCard();
  });

  row.append(title, select);
  section.append(heading, subtitle, row);
  return section;
};

const createLanguageSwitcher = () => {
  const text = getText();
  const wrapper = document.createElement("div");
  wrapper.className = "toolbar-chip-group";

  const label = document.createElement("span");
  label.className = "toolbar-chip-label";
  label.textContent = text.languageLabel;

  const buttons = document.createElement("div");
  buttons.className = "toolbar-chip-buttons";

  for (const language of ["de", "en"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `toolbar-chip-button ${previewSettings.language === language ? "active" : ""}`;
    button.textContent = languageFlags[language];
    button.setAttribute("aria-pressed", String(previewSettings.language === language));
    button.title = language.toUpperCase();
    button.addEventListener("click", () => {
      if (previewSettings.language === language) {
        return;
      }

      previewSettings.language = language;
      renderAll();
    });
    buttons.append(button);
  }

  wrapper.append(label, buttons);
  return wrapper;
};

const createThemeSwitcher = () => {
  const text = getText();
  const wrapper = document.createElement("div");
  wrapper.className = "toolbar-chip-group";

  const label = document.createElement("span");
  label.className = "toolbar-chip-label";
  label.textContent = text.themeLabel;

  const buttons = document.createElement("div");
  buttons.className = "toolbar-chip-buttons";

  for (const theme of ["light", "dark"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `toolbar-chip-button ${previewSettings.theme === theme ? "active" : ""}`;
    button.textContent = themeIcons[theme];
    button.setAttribute("aria-pressed", String(previewSettings.theme === theme));
    button.title = theme === "light" ? text.themeLight : text.themeDark;
    button.addEventListener("click", () => {
      if (previewSettings.theme === theme) {
        return;
      }

      previewSettings.theme = theme;
      renderAll();
    });
    buttons.append(button);
  }

  wrapper.append(label, buttons);
  return wrapper;
};

const renderControls = () => {
  controlsRoot.replaceChildren();
  controlsRoot?.append(createPreviewWidthControl());
  controlsRoot?.append(createModeControl());

  for (const group of getSliderGroups()) {
    const section = document.createElement("section");
    section.className = "control-panel";

    const heading = document.createElement("div");
    heading.className = "control-panel-heading";
    heading.textContent = group.title;

    const subtitle = document.createElement("div");
    subtitle.className = "control-panel-subtitle";
    subtitle.textContent = getText().sliderSubtitle.replace("{unit}", group.unit);

    section.append(heading, subtitle);

    for (const slider of group.sliders) {
      section.append(createSlider(slider));
    }

    controlsRoot?.append(section);
  }
};

const renderLanguageSwitcher = () => {
  languageRoot?.replaceChildren(createLanguageSwitcher());
};

const renderThemeSwitcher = () => {
  themeRoot?.replaceChildren(createThemeSwitcher());
};

const renderAll = () => {
  applyPageCopy();
  renderThemeSwitcher();
  renderLanguageSwitcher();
  renderControls();
  renderCard();
  applyPreviewWidth();
};

renderAll();

window.__PV_ENERGY_PREVIEW__ = {
  card,
  hass,
  config,
  stateValues,
  updateCard
};
