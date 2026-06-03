import type { Chart, Plugin } from "chart.js";
import {
  DonutConnectorLabelRenderer,
  type DonutConnectorLabelOptions
} from "./donut-label-renderer";

const runtimeMeta = new WeakMap<Chart<"doughnut">, DonutConnectorLabelOptions>();

export const setConnectorLabelRuntimeMeta = (
  chart: Chart<"doughnut">,
  options: DonutConnectorLabelOptions
): void => {
  runtimeMeta.set(chart, options);
};

export const connectorLabelPlugin: Plugin<"doughnut", DonutConnectorLabelOptions> = {
  id: "pvEnergyConnectorLabels",
  afterDatasetsDraw(chart: Chart<"doughnut">) {
    const runtimeOptions = runtimeMeta.get(chart);
    if (!runtimeOptions) {
      return;
    }

    new DonutConnectorLabelRenderer(chart, runtimeOptions).draw();
  }
};
