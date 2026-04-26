import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  Tooltip,
  type ChartConfiguration
} from "chart.js";
import { centerLabelPlugin, setCenterLabelRuntimeMeta } from "./center-label-plugin";
import { connectorLabelPlugin, setConnectorLabelRuntimeMeta } from "./connector-label-plugin";
import { segmentSeparatorPlugin } from "./segment-separator-plugin";
import type { DonutRenderModel } from "./types";

Chart.register(ArcElement, DoughnutController, Legend, Tooltip, segmentSeparatorPlugin, centerLabelPlugin, connectorLabelPlugin);

export class DonutRenderer {
  private chart?: Chart<"doughnut">;
  private readonly measureCanvas = document.createElement("canvas");
  private readonly resizeObserver?: ResizeObserver;
  private lastModel?: DonutRenderModel;
  private lastSharedHorizontalPadding?: number;
  private pendingResizeFrame?: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private locale: string,
    private textColor: string
  ) {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        const model = this.lastModel;
        if (!model || this.pendingResizeFrame !== undefined) {
          return;
        }

        this.pendingResizeFrame = window.requestAnimationFrame(() => {
          this.pendingResizeFrame = undefined;
          this.update(model, this.lastSharedHorizontalPadding);
        });
      });
      this.resizeObserver.observe(this.canvas);
    }
  }

  private readCssNumber(styles: CSSStyleDeclaration, propertyName: string, fallback: number): number {
    const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
    return Number.isFinite(value) ? value : fallback;
  }

  private createDisplayValues(model: DonutRenderModel, minimumVisibleValue: number): number[] {
    const values = model.data.map((segment) => Math.max(0, segment.value));
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total <= 0 || minimumVisibleValue <= 0) {
      return values;
    }

    const smallIndexes = values
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => value > 0 && value < minimumVisibleValue)
      .map(({ index }) => index);

    if (!smallIndexes.length) {
      return values;
    }

    const smallValueTarget = smallIndexes.length * minimumVisibleValue;
    if (smallValueTarget >= total) {
      return values;
    }

    const adjustedValues = [...values];
    for (const index of smallIndexes) {
      adjustedValues[index] = minimumVisibleValue;
    }

    const largeIndexes = values
      .map((_, index) => index)
      .filter((index) => !smallIndexes.includes(index));
    const largeValueTotal = largeIndexes.reduce((sum, index) => sum + values[index], 0);

    if (largeValueTotal <= 0) {
      return values;
    }

    const remainingValue = total - smallValueTarget;
    const scale = remainingValue / largeValueTotal;
    for (const index of largeIndexes) {
      adjustedValues[index] = values[index] * scale;
    }

    return adjustedValues;
  }

  private resolveMidRadius(horizontalPadding: number, verticalPadding: number): number {
    const firstArc = this.chart?.getDatasetMeta(0)?.data?.[0] as ArcElement | undefined;
    const chartMidRadius = firstArc ? (firstArc.innerRadius + firstArc.outerRadius) / 2 : 0;

    if (Number.isFinite(chartMidRadius) && chartMidRadius > 0) {
      return chartMidRadius;
    }

    const availableWidth = Math.max(1, this.canvas.clientWidth - horizontalPadding * 2);
    const availableHeight = Math.max(1, this.canvas.clientHeight - verticalPadding * 2);
    const outerRadius = Math.max(1, Math.min(availableWidth, availableHeight) / 2);
    const styles = getComputedStyle(this.canvas);
    const cutoutRatio = this.readCssNumber(styles, "--pv-chart-cutout", 76) / 100;
    return outerRadius * ((1 + cutoutRatio) / 2);
  }

  private calculateMinimumVisibleValue(
    model: DonutRenderModel,
    horizontalPadding: number,
    verticalPadding: number,
    minimumVisibleArc: number
  ): number {
    const total = model.data.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);

    if (total <= 0 || minimumVisibleArc <= 0) {
      return 0;
    }

    const midRadius = this.resolveMidRadius(horizontalPadding, verticalPadding);
    const circumference = 2 * Math.PI * midRadius;

    if (!Number.isFinite(circumference) || circumference <= 0) {
      return 0;
    }

    return total * (minimumVisibleArc / circumference);
  }

  public measureHorizontalPadding(model: DonutRenderModel): number {
    const width = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || 0;
    const styles = getComputedStyle(this.canvas);
    const percentScale = this.readCssNumber(styles, "--pv-label-percent-scale", 1);
    const percentMin = this.readCssNumber(styles, "--pv-label-percent-min", 12);
    const percentMax = this.readCssNumber(styles, "--pv-label-percent-max", 20);
    const valueScale = this.readCssNumber(styles, "--pv-label-value-scale", 1);
    const valueMin = this.readCssNumber(styles, "--pv-label-value-min", 9);
    const valueMax = this.readCssNumber(styles, "--pv-label-value-max", 14);
    const textScale = this.readCssNumber(styles, "--pv-label-text-scale", 1);
    const textMin = this.readCssNumber(styles, "--pv-label-text-min", 10);
    const textMax = this.readCssNumber(styles, "--pv-label-text-max", 16);
    const radiusGuess = Math.max(48, Math.min(width * 0.18, 96));
    const percentFontSize = Math.max(percentMin, Math.min(percentMax, Math.round(radiusGuess * 0.14 * percentScale)));
    const valueFontSize = Math.max(valueMin, Math.min(valueMax, Math.round(percentFontSize * 0.5 * valueScale)));
    const labelFontSize = Math.max(textMin, Math.min(textMax, Math.round(percentFontSize * 0.52 * textScale)));
    const valueGap = Math.max(10, Math.round(percentFontSize * 0.42));
    const ctx = this.measureCanvas.getContext("2d");

    if (!ctx) {
      return width <= 360 ? 64 : width <= 460 ? 92 : 132;
    }

    const percentFont = `600 ${percentFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const valueFont = `500 ${valueFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const labelFont = `500 ${labelFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const maxPercentWidth = Math.max(
      ...model.data.map((segment) => {
        ctx.font = percentFont;
        return ctx.measureText(`${Math.round(segment.percentage)}%`).width;
      }),
      0
    );
    const maxValueWidth = Math.max(
      ...model.data.map((segment) => {
        ctx.font = valueFont;
        return ctx.measureText(segment.formattedValue).width;
      }),
      0
    );
    const maxLabelWidth = Math.max(
      ...model.data.map((segment) => {
        ctx.font = labelFont;
        return ctx.measureText(segment.label).width;
      }),
      0
    );
    const topRowWidth = maxPercentWidth + valueGap + maxValueWidth;
    const needed = Math.max(topRowWidth, maxLabelWidth) + 24;
    const maxPadding = Math.max(64, Math.floor(width * 0.34));
    const minPadding = width <= 360 ? 56 : width <= 460 ? 72 : 96;
    return Math.max(minPadding, Math.min(maxPadding, Math.ceil(needed)));
  }

  update(model: DonutRenderModel, sharedHorizontalPadding?: number): void {
    this.lastModel = model;
    this.lastSharedHorizontalPadding = sharedHorizontalPadding;

    const values = model.data.map((segment) => segment.value);
    const colors = model.data.map((segment) => segment.color);
    const labels = model.data.map((segment) => segment.label);
    const horizontalPadding = sharedHorizontalPadding ?? this.measureHorizontalPadding(model);
    const styles = getComputedStyle(this.canvas);
    const verticalPadding = this.readCssNumber(styles, "--pv-chart-padding-y", 14);
    const minimumSegmentWidth = this.readCssNumber(styles, "--pv-chart-min-segment-width", 0.5);
    const separatorWidth = this.readCssNumber(styles, "--pv-chart-separator-width", 5);
    const minimumSegmentSeparatorFactor = this.readCssNumber(styles, "--pv-chart-min-segment-separator-factor", 1.5);
    const cutout = `${this.readCssNumber(styles, "--pv-chart-cutout", 76)}%`;
    // Reserve the visible mini segment plus a configurable share of separator space.
    const minimumVisibleArc = minimumSegmentWidth + separatorWidth * minimumSegmentSeparatorFactor;
    if (!this.chart) {
      const config: ChartConfiguration<"doughnut"> = {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderWidth: 0,
              hoverBorderWidth: 0,
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout,
          layout: {
            padding: {
              top: verticalPadding,
              right: horizontalPadding,
              bottom: verticalPadding,
              left: horizontalPadding
            }
          },
          animation: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          }
        }
      };

      this.chart = new Chart(this.canvas, config);
      this.chart.update("none");
    }

    const minimumVisibleValue = this.calculateMinimumVisibleValue(
      model,
      horizontalPadding,
      verticalPadding,
      minimumVisibleArc
    );
    const displayValues = this.createDisplayValues(model, minimumVisibleValue);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = displayValues;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.data.datasets[0].borderWidth = 0;
    this.chart.data.datasets[0].hoverBorderWidth = 0;
    setCenterLabelRuntimeMeta(this.chart, {
      title: model.title,
      totalFormatted: model.totalFormatted
    });
    setConnectorLabelRuntimeMeta(this.chart, {
      locale: this.locale,
      data: model.data,
      textColor: this.textColor
    });
    if (this.chart.options.layout?.padding && typeof this.chart.options.layout.padding !== "function") {
      this.chart.options.layout.padding = {
        top: verticalPadding,
        right: horizontalPadding,
        bottom: verticalPadding,
        left: horizontalPadding
      };
    }
    this.chart.options.cutout = cutout;
    this.chart.update("none");
  }

  resize(locale: string, textColor: string): void {
    this.locale = locale;
    this.textColor = textColor;
  }

  destroy(): void {
    if (this.pendingResizeFrame !== undefined) {
      window.cancelAnimationFrame(this.pendingResizeFrame);
      this.pendingResizeFrame = undefined;
    }

    this.resizeObserver?.disconnect();
    this.chart?.destroy();
    this.chart = undefined;
    this.lastModel = undefined;
    this.lastSharedHorizontalPadding = undefined;
  }
}
