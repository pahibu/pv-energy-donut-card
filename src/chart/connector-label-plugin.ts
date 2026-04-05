import type { ArcElement, Chart, Plugin } from "chart.js";
import { formatPercentage } from "../utils/format";
import { clamp } from "../utils/math";
import type { DonutRenderDatum } from "./types";

interface ConnectorPluginOptions {
  locale: string;
  data: DonutRenderDatum[];
  textColor: string;
}

const runtimeMeta = new WeakMap<Chart<"doughnut">, ConnectorPluginOptions>();

export const setConnectorLabelRuntimeMeta = (
  chart: Chart<"doughnut">,
  options: ConnectorPluginOptions
): void => {
  runtimeMeta.set(chart, options);
};

interface LabelLayout {
  active: boolean;
  color: string;
  valueText: string;
  labelText: string;
  percentageText: string;
  side: "left" | "right";
  anchorX: number;
  anchorY: number;
  breakX: number;
  breakY: number;
  lineEndX: number;
  labelTopY: number;
}

const MIN_LABEL_GAP = 50;

const measureTextWidth = (
  ctx: CanvasRenderingContext2D,
  font: string,
  text: string
): number => {
  ctx.save();
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
};

const readCssNumber = (
  styles: CSSStyleDeclaration,
  propertyName: string,
  fallback: number
): number => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
  return Number.isFinite(value) ? value : fallback;
};

const resolveDatasetColor = (
  backgroundColors: unknown,
  index: number,
  fallback: string
): string => {
  if (Array.isArray(backgroundColors) && typeof backgroundColors[index] === "string") {
    return backgroundColors[index];
  }

  return typeof backgroundColors === "string" ? backgroundColors : fallback;
};

const hexToRgba = (color: string, alpha: number): string => {
  const hex = color.trim().replace("#", "");
  if (!/^[\da-fA-F]{6}$/.test(hex)) {
    return color;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const layoutLabels = (
  items: LabelLayout[],
  minY: number,
  maxY: number,
  minGap: number
): LabelLayout[] => {
  const sorted = [...items].sort((a, b) => a.labelTopY - b.labelTopY);
  let previousY = minY - minGap;

  for (const item of sorted) {
    item.labelTopY = Math.max(item.labelTopY, previousY + minGap);
    previousY = item.labelTopY;
  }

  previousY = maxY + minGap;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const item = sorted[index];
    item.labelTopY = Math.min(item.labelTopY, previousY - minGap);
    previousY = item.labelTopY;
  }

  return sorted;
};

export const connectorLabelPlugin: Plugin<"doughnut", ConnectorPluginOptions> = {
  id: "pvEnergyConnectorLabels",
  afterDatasetsDraw(chart: Chart<"doughnut">) {
    const { ctx, chartArea } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length || !chartArea) {
      return;
    }

    const runtimeOptions = runtimeMeta.get(chart);
    const data = runtimeOptions?.data ?? [];
    const locale = runtimeOptions?.locale ?? "en";
    const textColor = runtimeOptions?.textColor ?? "#d8dee9";
    const activeIndexes = new Set(chart.getActiveElements().map((entry) => entry.index));
    const datasetBackgroundColors = chart.data.datasets[0]?.backgroundColor;

    const arcItems = meta.data
      .map((element, index) => ({
        element: element as ArcElement,
        datum: data[index],
        index
      }))
      .filter(({ datum }) => datum && datum.value > 0);

    if (!arcItems.length) {
      return;
    }

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
    const offset = Math.max(radius * 0.16, 18);
    const outerLabelOffset = Math.max(radius * 0.4, 44);

    const styles = getComputedStyle(chart.canvas);
    const valueColor = styles.getPropertyValue("--pv-card-text").trim() || textColor;
    const labelColor = styles.getPropertyValue("--pv-card-muted").trim() || valueColor;
    const percentScale = readCssNumber(styles, "--pv-label-percent-scale", 1);
    const percentMin = readCssNumber(styles, "--pv-label-percent-min", 12);
    const percentMax = readCssNumber(styles, "--pv-label-percent-max", 20);
    const valueScale = readCssNumber(styles, "--pv-label-value-scale", 1);
    const valueMin = readCssNumber(styles, "--pv-label-value-min", 9);
    const valueMax = readCssNumber(styles, "--pv-label-value-max", 14);
    const textScale = readCssNumber(styles, "--pv-label-text-scale", 1);
    const textMin = readCssNumber(styles, "--pv-label-text-min", 10);
    const textMax = readCssNumber(styles, "--pv-label-text-max", 16);
    const lineWidth = readCssNumber(styles, "--pv-label-line-width", 1);
    const percentFontSize = clamp(Math.round(radius * 0.14 * percentScale), percentMin, percentMax);
    const valueFontSize = clamp(Math.round(percentFontSize * 0.5 * valueScale), valueMin, valueMax);
    const labelFontSize = clamp(Math.round(percentFontSize * 0.52 * textScale), textMin, textMax);
    const topRowYShift = percentFontSize * 0.08;
    const valueGap = Math.max(4, Math.round(percentFontSize * 0.18));
    const rowGap = Math.max(4, Math.round(percentFontSize * 0.28));
    const labelOffset = percentFontSize + rowGap + labelFontSize * 0.1 - 8;
    const labelHalfHeight = labelFontSize * 0.6;
    const labelBoundTop = chartArea.top + 16;
    const labelBoundBottom = chartArea.bottom - 16 - labelOffset - labelHalfHeight + 6;
    const labelCollisionGap = Math.max(
      MIN_LABEL_GAP,
      Math.round(percentFontSize + labelFontSize + rowGap + valueFontSize * 0.6)
    );
    const percentFont = `600 ${percentFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const valueFont = `500 ${valueFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const labelFont = `500 ${labelFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const canvasBoundLeft = 8;
    const canvasBoundRight = chart.width - 8;
    const layouts: LabelLayout[] = arcItems.map(({ element, datum, index }) => {
      const angle = (element.startAngle + element.endAngle) / 2;
      const anchorX = centerX + Math.cos(angle) * element.outerRadius;
      const anchorY = centerY + Math.sin(angle) * element.outerRadius;
      const breakX = centerX + Math.cos(angle) * (element.outerRadius + offset);
      const breakY = centerY + Math.sin(angle) * (element.outerRadius + offset);
      const side = breakX >= centerX ? "right" : "left";
      const lineEndX = side === "right" ? centerX + radius + outerLabelOffset : centerX - radius - outerLabelOffset;

      return {
        color: resolveDatasetColor(datasetBackgroundColors, index, datum.color),
        valueText: datum.formattedValue,
        labelText: datum.label,
        percentageText: `${formatPercentage(datum.percentage, locale)}%`,
        side,
        anchorX,
        anchorY,
        breakX,
        breakY,
        lineEndX,
        labelTopY: clamp(breakY, labelBoundTop, labelBoundBottom),
        active: activeIndexes.has(index)
      };
    });
    const left = layoutLabels(
      layouts.filter((item) => item.side === "left"),
      labelBoundTop,
      labelBoundBottom,
      labelCollisionGap
    );
    const right = layoutLabels(
      layouts.filter((item) => item.side === "right"),
      labelBoundTop,
      labelBoundBottom,
      labelCollisionGap
    );
    const leftVisibleEdge = left.reduce((edge, item) => {
      const topRowWidth = measureTextWidth(ctx, percentFont, item.percentageText) + valueGap + measureTextWidth(ctx, valueFont, item.valueText);
      return Math.max(edge, Math.max(canvasBoundLeft, item.lineEndX - 8 - topRowWidth));
    }, canvasBoundLeft);
    const rightVisibleEdge = right.reduce((edge, item) => {
      const topRowWidth = measureTextWidth(ctx, percentFont, item.percentageText) + valueGap + measureTextWidth(ctx, valueFont, item.valueText);
      return Math.min(edge, Math.min(canvasBoundRight, item.lineEndX + 8 + topRowWidth));
    }, canvasBoundRight);

    ctx.save();
    for (const item of [...left, ...right]) {
      const connectorLineWidth = Math.max(1, lineWidth);
      const hoverLineWidth = item.active ? connectorLineWidth + 0.5 : connectorLineWidth;
      const itemPercentFontSize = percentFontSize;
      const itemValueFontSize = valueFontSize;
      const itemLabelFontSize = Math.round(labelFontSize * (item.active ? 1.04 : 1));
      const itemPercentFont = `600 ${itemPercentFontSize}px ui-sans-serif, system-ui, sans-serif`;
      const itemValueFont = `500 ${itemValueFontSize}px ui-sans-serif, system-ui, sans-serif`;
      const itemLabelFont = `500 ${itemLabelFontSize}px ui-sans-serif, system-ui, sans-serif`;
      const textAlign = item.side === "right" ? "left" : "right";
      const topRowY = item.labelTopY - topRowYShift;
      ctx.font = itemPercentFont;
      const percentMetrics = ctx.measureText(item.percentageText);
      const percentWidth = measureTextWidth(ctx, itemPercentFont, item.percentageText);
      ctx.font = itemValueFont;
      const valueMetrics = ctx.measureText(item.valueText);
      const valueWidth = measureTextWidth(ctx, itemValueFont, item.valueText);
      ctx.font = itemLabelFont;
      const labelWidth = measureTextWidth(ctx, itemLabelFont, item.labelText);
      const topRowWidth = percentWidth + valueGap + valueWidth;
      const outerX =
        item.side === "right"
          ? rightVisibleEdge - topRowWidth
          : leftVisibleEdge + topRowWidth;
      const percentX =
        item.side === "right"
          ? outerX + valueWidth + valueGap + 4
          : outerX - valueWidth - valueGap - 4;
      const valueX =
        item.side === "right"
          ? outerX + 4
          : outerX - 4;
      const labelX =
        item.side === "right"
          ? percentX + percentWidth
          : percentX - percentWidth;
      const percentDescent = percentMetrics.actualBoundingBoxDescent || itemPercentFontSize * 0.16;
      const valueDescent = valueMetrics.actualBoundingBoxDescent || itemValueFontSize * 0.16;
      const topRowBaselineY = topRowY + itemPercentFontSize * 0.28;
      const percentY = topRowBaselineY - percentDescent;
      const valueY = topRowBaselineY - valueDescent;
      const labelY = item.labelTopY + labelOffset;
      const labelTopEdgeY = labelY - labelHalfHeight;
      const topRowBottomY = Math.max(percentY, valueY);
      const lineY = topRowBottomY + (labelTopEdgeY - topRowBottomY) * 0.6;
      const lineOuterX = labelX;
      const lineInnerX =
        item.side === "right"
          ? Math.min(valueX, labelX - labelWidth)
          : Math.max(valueX, labelX + labelWidth);

      ctx.textAlign = textAlign;
      ctx.textBaseline = "alphabetic";

      ctx.strokeStyle = item.active ? item.color : hexToRgba(item.color, 0.82);
      ctx.lineWidth = hoverLineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lineOuterX, lineY);
      ctx.lineTo(lineInnerX, lineY);
      ctx.lineTo(item.anchorX, item.anchorY);
      ctx.stroke();

      ctx.fillStyle = item.color;
      ctx.font = itemPercentFont;
      ctx.fillText(item.percentageText, percentX, percentY);

      ctx.fillStyle = valueColor;
      ctx.font = itemValueFont;
      ctx.fillText(item.valueText, valueX, valueY);

      ctx.fillStyle = labelColor;
      ctx.font = itemLabelFont;
      ctx.textAlign = item.side === "right" ? "right" : "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.labelText, labelX, labelY);
    }

    ctx.restore();
  }
};
