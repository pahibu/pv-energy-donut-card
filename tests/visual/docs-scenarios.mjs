import { createBaseConfig, createBaseStateValues, createSingleChartConfig } from "./scenarios.mjs";

const docsCardTheme = {
  "--ha-card-background": "rgba(14, 18, 27, 0.54)",
  "--card-background-color": "rgba(14, 18, 27, 0.54)",
  "--ha-card-border-color": "rgba(214, 225, 239, 0.10)",
  "--divider-color": "rgba(214, 225, 239, 0.10)",
  "--primary-text-color": "#eef4fb",
  "--secondary-text-color": "#b2c0d1",
  "--error-color": "#ff9a9a",
  "--state-error-color": "#ff9a9a",
  "--ha-card-box-shadow": "0 28px 60px rgba(0, 0, 0, 0.28)"
};

const labels = {
  de: {
    cardTitle: "PV-Energieübersicht",
    consumption: "Verbrauch",
    feedIn: "Einspeisung",
    batteryCharge: "Batterieladung",
    pvSelfConsumption: "PV-Eigenverbrauch",
    batteryDischarge: "Batterieentladung",
    gridImport: "Netzbezug",
    production: "Produktion"
  },
  en: {
    cardTitle: "PV Energy Overview",
    consumption: "Consumption",
    feedIn: "Feed-in",
    batteryCharge: "Battery charge",
    pvSelfConsumption: "PV self-consumption",
    batteryDischarge: "Battery discharge",
    gridImport: "Grid import",
    production: "Production"
  }
};

const createLocalizedConfig = (language) => {
  const text = labels[language];
  const config = createBaseConfig();
  config.title = text.cardTitle;
  config.charts[0].title = text.production;
  config.charts[0].segments[0].label = text.feedIn;
  config.charts[0].segments[1].label = text.batteryCharge;
  config.charts[0].segments[2].label = text.pvSelfConsumption;
  config.charts[1].title = text.consumption;
  config.charts[1].segments[0].label = text.pvSelfConsumption;
  config.charts[1].segments[1].label = text.batteryDischarge;
  config.charts[1].segments[2].label = text.gridImport;
  return config;
};

const createLocalizedSingleChartConfig = (language) => {
  const text = labels[language];
  const config = createSingleChartConfig();
  config.title = text.cardTitle;
  config.charts[0].title = text.production;
  config.charts[0].segments[0].label = text.feedIn;
  config.charts[0].segments[1].label = text.batteryCharge;
  config.charts[0].segments[2].label = text.pvSelfConsumption;
  return config;
};

const createLanguageScenarios = (language, locale) => {
  const localizedConfig = createLocalizedConfig(language);
  const localizedSingleChartConfig = createLocalizedSingleChartConfig(language);

  return [
    {
      fileName: "charts-one.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: localizedSingleChartConfig,
      stateValues: createBaseStateValues()
    },
    {
      fileName: "charts-two.png",
      locale,
      cardWidth: 860,
      viewport: { width: 1100, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: localizedConfig,
      stateValues: createBaseStateValues()
    },
    {
      fileName: "charts-two-horizontal-simple.png",
      locale,
      cardWidth: 1120,
      viewport: { width: 1360, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: localizedConfig,
      stateValues: createBaseStateValues()
    },
    {
      fileName: "mode-simple.png",
      locale,
      cardWidth: 860,
      viewport: { width: 1100, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: localizedConfig,
      stateValues: createBaseStateValues()
    },
    {
      fileName: "mode-time-navigator.png",
      locale,
      cardWidth: 460,
      viewport: { width: 920, height: 840, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedConfig,
        mode: "time_navigator"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "charts-two-horizontal-time-navigator.png",
      locale,
      cardWidth: 1120,
      viewport: { width: 1360, height: 860, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedConfig,
        mode: "time_navigator"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "spacing-relaxed.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        segment_spacing: "relaxed"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "spacing-compact.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        segment_spacing: "compact"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "spacing-none.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        segment_spacing: "none"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "ring-thin.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        ring_size: "thin"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "ring-airy.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        ring_size: "airy"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "ring-balanced.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        ring_size: "balanced"
      },
      stateValues: createBaseStateValues()
    },
    {
      fileName: "ring-bold.png",
      locale,
      cardWidth: 520,
      viewport: { width: 920, height: 760, deviceScaleFactor: 1 },
      theme: docsCardTheme,
      config: {
        ...localizedSingleChartConfig,
        ring_size: "bold"
      },
      stateValues: createBaseStateValues()
    }
  ];
};

export const docsScreenshotScenarios = {
  en: createLanguageScenarios("en", "en-US"),
  de: createLanguageScenarios("de", "de-DE")
};

export const docsScreenshotBackgrounds = {
  "midnight-stage": {
    label: "Midnight Stage"
  },
  "aurora-noir": {
    label: "Aurora Noir"
  }
};
