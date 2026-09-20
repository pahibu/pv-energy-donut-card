export const sharedTheme = {
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

export const createBaseConfig = () => ({
  type: "custom:pv-energy-donut-card",
  title: "PV Energy Overview",
  mode: "simple",
  ring_size: "balanced",
  label_preset: "balanced",
  label_distance: "balanced",
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

export const createSingleChartConfig = () => ({
  type: "custom:pv-energy-donut-card",
  title: "PV Energy Overview",
  mode: "simple",
  ring_size: "balanced",
  label_preset: "balanced",
  label_distance: "balanced",
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

export const createBaseStateValues = () => ({
  "sensor.preview_feed_in_today": 4.6,
  "sensor.preview_battery_charge_today": 2.1,
  "sensor.preview_pv_self_use_production_today": 5.7,
  "sensor.preview_pv_self_use_consumption_today": 5.7,
  "sensor.preview_battery_discharge_today": 1.9,
  "sensor.preview_grid_import_today": 3.8
});

const iphoneViewport = {
  width: 393,
  height: 852,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
};

const createIphoneScenario = ({
  snapshotName,
  config,
  stateValues = createBaseStateValues(),
  locale = "en-US",
  viewport = iphoneViewport
}) => ({
  snapshotName,
  viewport,
  cardWidth: viewport.width - 24,
  pagePadding: "12px",
  locale,
  theme: sharedTheme,
  config,
  stateValues
});

export const visualScenarios = {
  ...Object.fromEntries(["balanced", "compact", "minimal", "highlight"].map((preset) => {
    const name = `iphone-large-label-${preset}`;
    return [name, createIphoneScenario({
      snapshotName: name,
      viewport: { ...iphoneViewport, width: 430, height: 932 },
      config: { ...createSingleChartConfig(), label_preset: preset }
    })];
  })),
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
  "label-balanced": {
    snapshotName: "label-balanced",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      label_preset: "balanced"
    },
    stateValues: createBaseStateValues()
  },
  "label-compact": {
    snapshotName: "label-compact",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      label_preset: "compact"
    },
    stateValues: createBaseStateValues()
  },
  "label-minimal": {
    snapshotName: "label-minimal",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      label_preset: "minimal"
    },
    stateValues: createBaseStateValues()
  },
  "label-highlight": {
    snapshotName: "label-highlight",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      label_preset: "highlight"
    },
    stateValues: createBaseStateValues()
  },
  "label-distance-wide": {
    snapshotName: "label-distance-wide",
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
      label_distance: "wide"
    },
    stateValues: createBaseStateValues()
  },
  "label-distance-balanced": {
    snapshotName: "label-distance-balanced",
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
      label_distance: "balanced"
    },
    stateValues: createBaseStateValues()
  },
  "label-distance-compact": {
    snapshotName: "label-distance-compact",
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
      label_distance: "compact"
    },
    stateValues: createBaseStateValues()
  },
  "ring-airy": {
    snapshotName: "ring-airy",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      ring_size: "airy"
    },
    stateValues: createBaseStateValues()
  },
  "ring-thin": {
    snapshotName: "ring-thin",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      ring_size: "thin"
    },
    stateValues: createBaseStateValues()
  },
  "ring-bold": {
    snapshotName: "ring-bold",
    viewport: {
      width: 920,
      height: 760,
      deviceScaleFactor: 1
    },
    cardWidth: 520,
    locale: "en-US",
    theme: sharedTheme,
    config: {
      ...createSingleChartConfig(),
      ring_size: "bold"
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
  "iphone-simple-default": createIphoneScenario({
    snapshotName: "iphone-simple-default",
    config: createBaseConfig()
  }),
  "iphone-spacing-compact": createIphoneScenario({
    snapshotName: "iphone-spacing-compact",
    config: {
      ...createBaseConfig(),
      segment_spacing: "compact"
    }
  }),
  "iphone-label-compact": createIphoneScenario({
    snapshotName: "iphone-label-compact",
    config: {
      ...createSingleChartConfig(),
      label_preset: "compact"
    }
  }),
  "iphone-label-minimal": createIphoneScenario({
    snapshotName: "iphone-label-minimal",
    config: {
      ...createSingleChartConfig(),
      label_preset: "minimal"
    }
  }),
  "iphone-ring-bold": createIphoneScenario({
    snapshotName: "iphone-ring-bold",
    config: {
      ...createSingleChartConfig(),
      ring_size: "bold"
    }
  }),
  "iphone-time-navigator": createIphoneScenario({
    snapshotName: "iphone-time-navigator",
    viewport: {
      ...iphoneViewport,
      height: 920
    },
    config: {
      ...createBaseConfig(),
      mode: "time_navigator"
    }
  }),
  "iphone-time-navigator-de": createIphoneScenario({
    snapshotName: "iphone-time-navigator-de",
    viewport: {
      ...iphoneViewport,
      height: 920
    },
    locale: "de-DE",
    config: {
      ...createBaseConfig(),
      mode: "time_navigator"
    }
  }),
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
  },
  "editor-en-ring-size": {
    snapshotName: "editor-en-ring-size",
    page: "editor-harness.html",
    viewport: {
      width: 1180,
      height: 1200,
      deviceScaleFactor: 1
    },
    locale: "en-US",
    theme: editorTheme,
    config: {
      ...createBaseConfig(),
      ring_size: "bold"
    }
  }
};

export const visualScenarioNames = Object.keys(visualScenarios);
