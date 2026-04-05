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
import type { DonutRenderModel } from "./types";

Chart.register(ArcElement, DoughnutController, Legend, Tooltip, centerLabelPlugin, connectorLabelPlugin);

export class DonutRenderer {
  private chart?: Chart<"doughnut">;
  private readonly measureCanvas = document.createElement("canvas");

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private locale: string,
    private textColor: string
  ) {}

  private readCssNumber(styles: CSSStyleDeclaration, propertyName: string, fallback: number): number {
    const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
    return Number.isFinite(value) ? value : fallback;
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
    const values = model.data.map((segment) => segment.value);
    const colors = model.data.map((segment) => segment.color);
    const labels = model.data.map((segment) => segment.label);
    const horizontalPadding = sharedHorizontalPadding ?? this.measureHorizontalPadding(model);
    const styles = getComputedStyle(this.canvas);
    const verticalPadding = this.readCssNumber(styles, "--pv-chart-padding-y", 14);
    const separatorColor = styles.getPropertyValue("--pv-card-divider").trim() || this.textColor;
    const segmentSpacing = 4;

    if (!this.chart) {
      const config: ChartConfiguration<"doughnut"> = {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderColor: separatorColor,
              borderWidth: 2,
              hoverBorderColor: separatorColor,
              hoverBorderWidth: 2,
              hoverOffset: 4,
              spacing: segmentSpacing
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "76%",
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
      setCenterLabelRuntimeMeta(this.chart, {
        title: model.title,
        totalFormatted: model.totalFormatted
      });
      setConnectorLabelRuntimeMeta(this.chart, {
        locale: this.locale,
        data: model.data,
        textColor: this.textColor
      });
      this.chart.update("none");
      return;
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.data.datasets[0].borderColor = separatorColor;
    this.chart.data.datasets[0].hoverBorderColor = separatorColor;
    this.chart.data.datasets[0].hoverBorderWidth = 2;
    this.chart.data.datasets[0].spacing = segmentSpacing;
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
    this.chart.update("none");
  }

  resize(locale: string, textColor: string): void {
    this.locale = locale;
    this.textColor = textColor;
  }

  destroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
