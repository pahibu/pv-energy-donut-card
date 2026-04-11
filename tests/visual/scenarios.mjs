const sharedTheme = {
  "--ha-card-background": "rgba(9, 17, 27, 0.78)",
  "--card-background-color": "rgba(9, 17, 27, 0.78)",
  "--ha-card-border-color": "rgba(158, 176, 196, 0.18)",
  "--divider-color": "rgba(158, 176, 196, 0.18)",
  "--primary-text-color": "#eef4fb",
  "--secondary-text-color": "#9eb0c4",
  "--error-color": "#ff8d8d",
  "--state-error-color": "#ff8d8d",
  "--ha-card-box-shadow": "0 18px 40px rgba(0, 0, 0, 0.18)"
};

const editorTheme = {
  "--card-background-color": "rgba(9, 17, 27, 0.78)",
  "--primary-text-color": "#eef4fb",
  "--secondary-text-color": "#9eb0c4"
};

const createBaseConfig = () => ({
  type: "custom:pv-energy-donut-card",
  title: "PV Energy Overview",
  mode: "simple",
  value_precision: 1,
  total_precision: 1,
  charts: [
    {
      key: "production",
      title: "Production",
      unit: "kWh",
      segments: [
        {
          entity: "sensor.preview_feed_in_today",
          label: "Feed-in",
          color: "#5dade2"
        },
        {
          entity: "sensor.preview_battery_charge_today",
          label: "Battery charge",
          color: "#f5b041"
        },
        {
          entity: "sensor.preview_pv_self_use_production_today",
          label: "PV self-consumption",
          color: "#58d68d"
        }
      ]
    },
    {
      key: "consumption",
      title: "Consumption",
      unit: "kWh",
      segments: [
        {
          entity: "sensor.preview_pv_self_use_consumption_today",
          label: "PV self-consumption",
          color: "#58d68d"
        },
        {
          entity: "sensor.preview_battery_discharge_today",
          label: "Battery discharge",
          color: "#af7ac5"
        },
        {
          entity: "sensor.preview_grid_import_today",
          label: "Grid import",
          color: "#ec7063"
        }
      ]
    }
  ]
});

const createSingleChartConfig = () => ({
  type: "custom:pv-energy-donut-card",
  title: "PV Energy Overview",
  mode: "simple",
  value_precision: 1,
  total_precision: 1,
  charts: [
    {
      key: "production",
      title: "Production",
      unit: "kWh",
      segments: [
        {
          entity: "sensor.preview_feed_in_today",
          label: "Feed-in",
          color: "#5dade2"
        },
        {
          entity: "sensor.preview_battery_charge_today",
          label: "Battery charge",
          color: "#f5b041"
        },
        {
          entity: "sensor.preview_pv_self_use_production_today",
          label: "PV self-consumption",
          color: "#58d68d"
        }
      ]
    }
  ]
});

const createBaseStateValues = () => ({
  "sensor.preview_feed_in_today": 4.6,
  "sensor.preview_battery_charge_today": 2.1,
  "sensor.preview_pv_self_use_production_today": 5.7,
  "sensor.preview_pv_self_use_consumption_today": 5.7,
  "sensor.preview_battery_discharge_today": 1.9,
  "sensor.preview_grid_import_today": 3.8
});

export const visualScenarios = {
  "simple-default": {
    snapshotName: "simple-default",
    viewport: {
      width: 1100,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 860,
    locale: "en-US",
    theme: sharedTheme,
    config: createBaseConfig(),
    stateValues: createBaseStateValues()
  },
  "tiny-segment-gap": {
    snapshotName: "tiny-segment-gap",
    viewport: {
      width: 1100,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 860,
    locale: "en-US",
    theme: sharedTheme,
    config: createBaseConfig(),
    stateValues: {
      ...createBaseStateValues(),
      "sensor.preview_feed_in_today": 0.08,
      "sensor.preview_battery_charge_today": 0.14,
      "sensor.preview_pv_self_use_production_today": 11.78
    }
  },
  "spacing-compact": {
    snapshotName: "spacing-compact",
    viewport: {
      width: 1100,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 860,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createBaseConfig(),
      segment_spacing: "compact"
    },
    stateValues: createBaseStateValues()
  },
  "spacing-none": {
    snapshotName: "spacing-none",
    viewport: {
      width: 1100,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 860,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createBaseConfig(),
      segment_spacing: "none"
    },
    stateValues: createBaseStateValues()
  },
  "single-chart-simple": {
    snapshotName: "single-chart-simple",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: createSingleChartConfig(),
    stateValues: createBaseStateValues()
  },
  "single-chart-time-navigator": {
    snapshotName: "single-chart-time-navigator",
    viewport: {
      width: 920,
      height: 840,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      mode: "time_navigator"
    },
    stateValues: createBaseStateValues()
  },
  "time-navigator": {
    snapshotName: "time-navigator",
    viewport: {
      width: 920,
      height: 840,
      deviceScaleFactor: 1
    },
    cardWidth: 460,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createBaseConfig(),
      mode: "time_navigator"
    },
    stateValues: createBaseStateValues()
  },
  "time-navigator-de": {
    snapshotName: "time-navigator-de",
    viewport: {
      width: 920,
      height: 840,
      deviceScaleFactor: 1
    },
    cardWidth: 460,
    locale: "de-DE",
    theme: sharedTheme,
    config: {
      ...createBaseConfig(),
      mode: "time_navigator"
    },
    stateValues: createBaseStateValues()
  },
  "editor-default": {
    snapshotName: "editor-default",
    page: "editor-harness.html",
    viewport: {
      width: 1180,
      height: 1200,
      deviceScaleFactor: 1
    },
    locale: "en-US",
    theme: editorTheme,
    config: createBaseConfig()
  },
  "editor-de-spacing": {
    snapshotName: "editor-de-spacing",
    page: "editor-harness.html",
    viewport: {
      width: 1180,
      height: 1200,
      deviceScaleFactor: 1
    },
    locale: "de-DE",
    theme: editorTheme,
    config: {
      ...createBaseConfig(),
      segment_spacing: "compact"
    }
  }
};

export const visualScenarioNames = Object.keys(visualScenarios);
