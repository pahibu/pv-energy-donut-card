import type { ArcElement, Chart } from "chart.js";
import { color, getHoverColor } from "chart.js/helpers";
import { formatPercentage } from "../utils/format";
import { clamp } from "../utils/math";
import type { DonutRenderDatum, DonutRenderModel } from "./types";

export interface DonutConnectorLabelOptions {
  locale: string;
  data: DonutRenderDatum[];
  textColor: string;
  typography?: DonutConnectorLabelTypography;
}

export interface DonutLabelVariant {
  name: "solarFlarePercent" | "wattFlowValue" | "orbitNoteText";
  weight: number;
  size: number;
  font: string;
}

export interface DonutConnectorLabelTypography {
  solarFlarePercent: DonutLabelVariant;
  wattFlowValue: DonutLabelVariant;
  orbitNoteText: DonutLabelVariant;
  lineWidth: number;
  valueOpacity: number;
  textOpacity: number;
  valueGapScale: number;
  rowGapScale: number;
  labelOffsetScale: number;
  collisionGapMin: number;
  valueGap: number;
  rowGap: number;
  topRowYShift: number;
  labelOffset: number;
  labelHalfHeight: number;
  collisionGap: number;
}

export interface DonutLabelMeasurePlan {
  horizontalPadding: number;
  typography: DonutConnectorLabelTypography;
}

type LabelSide = "left" | "right";

interface LabelLayout {
  active: boolean;
  color: string;
  valueText: string;
  labelText: string;
  percentageText: string;
  side: LabelSide;
  anchorX: number;
  anchorY: number;
  labelTopY: number;
}

interface LabelMeasurement {
  percentWidth: number;
  valueWidth: number;
  labelWidth: number;
  topRowWidth: number;
  blockWidth: number;
}

const FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";
const EDGE_MARGIN = 8;
const MIN_LABEL_GAP = 50;
const HOVER_PERCENT_SCALE = 1.02;

interface TypographyStyleOptions {
  percentWeight: number;
  valueWeight: number;
  textWeight: number;
  valueGapScale: number;
  rowGapScale: number;
  labelOffsetScale: number;
  collisionGapMin: number;
  valueOpacity: number;
  textOpacity: number;
}

const DEFAULT_TYPOGRAPHY_STYLE: TypographyStyleOptions = {
  percentWeight: 600,
  valueWeight: 500,
  textWeight: 500,
  valueGapScale: 1,
  rowGapScale: 1,
  labelOffsetScale: 1,
  collisionGapMin: MIN_LABEL_GAP,
  valueOpacity: 1,
  textOpacity: 1
};

const createVariant = (
  name: DonutLabelVariant["name"],
  weight: number,
  size: number
): DonutLabelVariant => ({
  name,
  weight,
  size,
  font: `${weight} ${size}px ${FONT_FAMILY}`
});

const readCssNumber = (
  styles: CSSStyleDeclaration,
  propertyName: string,
  fallback: number
): number => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
  return Number.isFinite(value) ? value : fallback;
};

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

const resolveNormalSegmentColor = (segmentColor: string): string => {
  try {
    const segment = color(segmentColor);
    return segment.valid ? segment.rgbString() : segmentColor;
  } catch {
    return segmentColor;
  }
};

const resolveHoverSegmentColor = (segmentColor: string): string => {
  try {
    return getHoverColor(segmentColor);
  } catch {
    return segmentColor;
  }
};

const layoutLabels = (
  items: LabelLayout[],
  minY: number,
  maxY: number,
  minGap: number
): LabelLayout[] => {
  if (!items.length) {
    return [];
  }

  const sorted = [...items].sort((a, b) => a.labelTopY - b.labelTopY);
  const availableHeight = Math.max(0, maxY - minY);
  const effectiveGap = sorted.length > 1
    ? Math.max(8, Math.min(minGap, availableHeight / (sorted.length - 1)))
    : minGap;
  let previousY = minY - effectiveGap;

  for (const item of sorted) {
    item.labelTopY = Math.max(item.labelTopY, previousY + effectiveGap);
    previousY = item.labelTopY;
  }

  previousY = maxY + effectiveGap;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const item = sorted[index];
    item.labelTopY = Math.min(item.labelTopY, previousY - effectiveGap);
    previousY = item.labelTopY;
  }

  for (const item of sorted) {
    item.labelTopY = clamp(item.labelTopY, minY, maxY);
  }

  return sorted;
};

const resolveOuterRadius = (
  width: number,
  height: number,
  horizontalPadding: number,
  verticalPadding: number
): number => {
  const availableWidth = Math.max(1, width - horizontalPadding * 2);
  const availableHeight = Math.max(1, height - verticalPadding * 2);
  return Math.max(1, Math.min(availableWidth, availableHeight) / 2);
};

const resolvePaddingBounds = (width: number): { minPadding: number; maxPadding: number } => ({
  minPadding: width <= 360 ? 56 : width <= 460 ? 72 : 96,
  maxPadding: Math.max(64, Math.floor(width * 0.34))
});

const resolveLabelOuterX = (
  side: LabelSide,
  centerX: number,
  canvasWidth: number,
  styles: CSSStyleDeclaration
): number => {
  const maxDistanceWidth = readCssNumber(styles, "--pv-label-distance-max-width", 0);
  const distanceWidth = maxDistanceWidth > 0 ? Math.min(canvasWidth, maxDistanceWidth) : canvasWidth;
  const halfDistance = Math.max(EDGE_MARGIN, distanceWidth / 2 - EDGE_MARGIN);

  return side === "right" ? centerX + halfDistance : centerX - halfDistance;
};

const createTypography = (
  percentSize: number,
  valueSize: number,
  textSize: number,
  lineWidth: number,
  style: TypographyStyleOptions = DEFAULT_TYPOGRAPHY_STYLE
): DonutConnectorLabelTypography => {
  const valueGap = Math.max(3, Math.round(percentSize * 0.18 * style.valueGapScale));
  const rowGap = Math.max(3, Math.round(percentSize * 0.28 * style.rowGapScale));

  return {
    solarFlarePercent: createVariant("solarFlarePercent", style.percentWeight, percentSize),
    wattFlowValue: createVariant("wattFlowValue", style.valueWeight, valueSize),
    orbitNoteText: createVariant("orbitNoteText", style.textWeight, textSize),
    lineWidth,
    valueOpacity: style.valueOpacity,
    textOpacity: style.textOpacity,
    valueGapScale: style.valueGapScale,
    rowGapScale: style.rowGapScale,
    labelOffsetScale: style.labelOffsetScale,
    collisionGapMin: style.collisionGapMin,
    valueGap,
    rowGap,
    topRowYShift: percentSize * 0.08,
    labelOffset: (percentSize + rowGap + textSize * 0.1 - 8) * style.labelOffsetScale,
    labelHalfHeight: textSize * 0.6,
    collisionGap: Math.max(
      style.collisionGapMin,
      Math.round(percentSize + textSize + rowGap + valueSize * 0.6)
    )
  };
};

export class DonutConnectorLabelRenderer {
  public static resolveTypography(
    styles: CSSStyleDeclaration,
    radius: number
  ): DonutConnectorLabelTypography {
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
    const percentWeight = readCssNumber(styles, "--pv-label-percent-weight", DEFAULT_TYPOGRAPHY_STYLE.percentWeight);
    const valueWeight = readCssNumber(styles, "--pv-label-value-weight", DEFAULT_TYPOGRAPHY_STYLE.valueWeight);
    const textWeight = readCssNumber(styles, "--pv-label-text-weight", DEFAULT_TYPOGRAPHY_STYLE.textWeight);
    const style: TypographyStyleOptions = {
      percentWeight,
      valueWeight,
      textWeight,
      valueGapScale: readCssNumber(styles, "--pv-label-value-gap-scale", DEFAULT_TYPOGRAPHY_STYLE.valueGapScale),
      rowGapScale: readCssNumber(styles, "--pv-label-row-gap-scale", DEFAULT_TYPOGRAPHY_STYLE.rowGapScale),
      labelOffsetScale: readCssNumber(styles, "--pv-label-offset-scale", DEFAULT_TYPOGRAPHY_STYLE.labelOffsetScale),
      collisionGapMin: readCssNumber(styles, "--pv-label-collision-gap-min", DEFAULT_TYPOGRAPHY_STYLE.collisionGapMin),
      valueOpacity: clamp(
        readCssNumber(styles, "--pv-label-value-opacity", DEFAULT_TYPOGRAPHY_STYLE.valueOpacity),
        0.2,
        1
      ),
      textOpacity: clamp(
        readCssNumber(styles, "--pv-label-text-opacity", DEFAULT_TYPOGRAPHY_STYLE.textOpacity),
        0.2,
        1
      )
    };
    const percentSize = clamp(Math.round(radius * 0.14 * percentScale), percentMin, percentMax);
    const valueSize = clamp(Math.round(percentSize * 0.5 * valueScale), valueMin, valueMax);
    const textSize = clamp(Math.round(percentSize * 0.52 * textScale), textMin, textMax);

    return createTypography(percentSize, valueSize, textSize, lineWidth, style);
  }

  public static mergeTypographies(
    typographies: DonutConnectorLabelTypography[]
  ): DonutConnectorLabelTypography | undefined {
    if (!typographies.length) {
      return undefined;
    }

    const percentSize = Math.min(...typographies.map((item) => item.solarFlarePercent.size));
    const valueSize = Math.min(...typographies.map((item) => item.wattFlowValue.size));
    const textSize = Math.min(...typographies.map((item) => item.orbitNoteText.size));
    const lineWidth = Math.max(...typographies.map((item) => item.lineWidth));
    const style: TypographyStyleOptions = {
      percentWeight: typographies[0].solarFlarePercent.weight,
      valueWeight: typographies[0].wattFlowValue.weight,
      textWeight: typographies[0].orbitNoteText.weight,
      valueGapScale: typographies[0].valueGapScale,
      rowGapScale: typographies[0].rowGapScale,
      labelOffsetScale: typographies[0].labelOffsetScale,
      collisionGapMin: typographies[0].collisionGapMin,
      valueOpacity: typographies[0].valueOpacity,
      textOpacity: typographies[0].textOpacity
    };
    return createTypography(percentSize, valueSize, textSize, lineWidth, style);
  }

  public static measureAutoPlan(
    ctx: CanvasRenderingContext2D | null,
    model: DonutRenderModel,
    locale: string,
    styles: CSSStyleDeclaration,
    width: number,
    height: number,
    verticalPadding: number
  ): DonutLabelMeasurePlan {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const { minPadding } = resolvePaddingBounds(safeWidth);
    let horizontalPadding = minPadding;
    let typography = DonutConnectorLabelRenderer.resolveTypography(
      styles,
      resolveOuterRadius(safeWidth, safeHeight, horizontalPadding, verticalPadding)
    );

    for (let index = 0; index < 4; index += 1) {
      const radius = resolveOuterRadius(safeWidth, safeHeight, horizontalPadding, verticalPadding);
      typography = DonutConnectorLabelRenderer.resolveTypography(styles, radius);
      const nextPadding = DonutConnectorLabelRenderer.measureHorizontalPadding(
        ctx,
        model,
        locale,
        safeWidth,
        typography
      );

      if (Math.abs(nextPadding - horizontalPadding) < 1) {
        horizontalPadding = nextPadding;
        break;
      }

      horizontalPadding = nextPadding;
    }

    typography = DonutConnectorLabelRenderer.resolveTypography(
      styles,
      resolveOuterRadius(safeWidth, safeHeight, horizontalPadding, verticalPadding)
    );

    return {
      horizontalPadding,
      typography
    };
  }

  public static measureHorizontalPadding(
    ctx: CanvasRenderingContext2D | null,
    model: DonutRenderModel,
    locale: string,
    width: number,
    typography: DonutConnectorLabelTypography
  ): number {
    const safeWidth = Math.max(1, width);
    const { minPadding, maxPadding } = resolvePaddingBounds(safeWidth);

    if (!ctx) {
      return clamp(safeWidth <= 360 ? 64 : safeWidth <= 460 ? 92 : 132, minPadding, maxPadding);
    }

    const visibleData = model.data.filter((segment) => segment.value > 0);
    const data = visibleData.length ? visibleData : model.data;
    const maxPercentWidth = Math.max(
      ...data.map((segment) =>
        measureTextWidth(
          ctx,
          typography.solarFlarePercent.font,
          `${formatPercentage(segment.percentage, locale)}%`
        )
      ),
      0
    );
    const maxValueWidth = Math.max(
      ...data.map((segment) =>
        measureTextWidth(ctx, typography.wattFlowValue.font, segment.formattedValue)
      ),
      0
    );
    const maxLabelWidth = Math.max(
      ...data.map((segment) =>
        measureTextWidth(ctx, typography.orbitNoteText.font, segment.label)
      ),
      0
    );
    const topRowWidth = maxPercentWidth + typography.valueGap + maxValueWidth;
    const needed = Math.max(topRowWidth, maxLabelWidth) + EDGE_MARGIN * 3;

    return clamp(Math.ceil(needed), minPadding, maxPadding);
  }

  constructor(
    private readonly chart: Chart<"doughnut">,
    private readonly options: DonutConnectorLabelOptions
  ) {}

  public draw(): void {
    const { ctx, chartArea } = this.chart;
    const meta = this.chart.getDatasetMeta(0);
    if (!meta?.data?.length || !chartArea) {
      return;
    }

    const arcItems = meta.data
      .map((element, index) => ({
        element: element as ArcElement,
        datum: this.options.data[index],
        index
      }))
      .filter(({ datum }) => datum && datum.value > 0);

    if (!arcItems.length) {
      return;
    }

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
    const styles = getComputedStyle(this.chart.canvas);
    const typography = this.options.typography ?? DonutConnectorLabelRenderer.resolveTypography(styles, radius);
    const valueColor = styles.getPropertyValue("--pv-card-text").trim() || this.options.textColor;
    const labelColor = styles.getPropertyValue("--pv-card-muted").trim() || valueColor;
    const activeIndexes = new Set(this.chart.getActiveElements().map((entry) => entry.index));
    const datasetBackgroundColors = this.chart.data.datasets[0]?.backgroundColor;
    const labelBoundTop = chartArea.top + 12;
    const labelBoundBottom = Math.max(
      labelBoundTop,
      chartArea.bottom - 12 - typography.labelOffset - typography.labelHalfHeight
    );
    const layouts: LabelLayout[] = arcItems.map(({ element, datum, index }) => {
      const angle = (element.startAngle + element.endAngle) / 2;
      const side: LabelSide = Math.cos(angle) >= 0 ? "right" : "left";
      const anchorX = centerX + Math.cos(angle) * element.outerRadius;
      const anchorY = centerY + Math.sin(angle) * element.outerRadius;
      const sideLaneY = centerY + Math.sin(angle) * element.outerRadius * 0.72;

      return {
        color: resolveDatasetColor(datasetBackgroundColors, index, datum.color),
        valueText: datum.formattedValue,
        labelText: datum.label,
        percentageText: `${formatPercentage(datum.percentage, this.options.locale)}%`,
        side,
        anchorX,
        anchorY,
        labelTopY: clamp(sideLaneY, labelBoundTop, labelBoundBottom),
        active: activeIndexes.has(index)
      };
    });
    const left = layoutLabels(
      layouts.filter((item) => item.side === "left"),
      labelBoundTop,
      labelBoundBottom,
      typography.collisionGap
    );
    const right = layoutLabels(
      layouts.filter((item) => item.side === "right"),
      labelBoundTop,
      labelBoundBottom,
      typography.collisionGap
    );

    ctx.save();
    for (const item of [...left, ...right]) {
      this.drawLabel(ctx, item, typography, valueColor, labelColor, centerX, styles);
    }
    ctx.restore();
  }

  private measureLabel(
    ctx: CanvasRenderingContext2D,
    item: LabelLayout,
    typography: DonutConnectorLabelTypography
  ): LabelMeasurement {
    const percentWidth = measureTextWidth(ctx, typography.solarFlarePercent.font, item.percentageText);
    const valueWidth = measureTextWidth(ctx, typography.wattFlowValue.font, item.valueText);
    const labelWidth = measureTextWidth(ctx, typography.orbitNoteText.font, item.labelText);
    const topRowWidth = percentWidth + typography.valueGap + valueWidth;

    return {
      percentWidth,
      valueWidth,
      labelWidth,
      topRowWidth,
      blockWidth: Math.max(topRowWidth, labelWidth)
    };
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    item: LabelLayout,
    typography: DonutConnectorLabelTypography,
    valueColor: string,
    labelColor: string,
    centerX: number,
    styles: CSSStyleDeclaration
  ): void {
    const measurement = this.measureLabel(ctx, item, typography);
    const normalColor = resolveNormalSegmentColor(item.color);
    const hoverColor = resolveHoverSegmentColor(item.color);
    const accentColor = item.active ? hoverColor : normalColor;
    const outerX = resolveLabelOuterX(item.side, centerX, this.chart.width, styles);
    const direction = item.side === "right" ? -1 : 1;
    const lineInnerX = outerX + direction * measurement.blockWidth;
    const lineWidth = Math.max(0.5, typography.lineWidth);
    const topRowY = item.labelTopY - typography.topRowYShift;
    const topRowBaselineY = topRowY + typography.solarFlarePercent.size * 0.28;
    const percentMetrics = this.measureTextMetrics(ctx, typography.solarFlarePercent.font, item.percentageText);
    const valueMetrics = this.measureTextMetrics(ctx, typography.wattFlowValue.font, item.valueText);
    const percentDescent = percentMetrics.actualBoundingBoxDescent || typography.solarFlarePercent.size * 0.16;
    const valueDescent = valueMetrics.actualBoundingBoxDescent || typography.wattFlowValue.size * 0.16;
    const percentY = topRowBaselineY - percentDescent;
    const valueY = topRowBaselineY - valueDescent;
    const labelY = item.labelTopY + typography.labelOffset;
    const labelTopEdgeY = labelY - typography.labelHalfHeight;
    const topRowBottomY = Math.max(percentY, valueY);
    const lineY = topRowBottomY + (labelTopEdgeY - topRowBottomY) * 0.6;
    const topRowInnerX = item.side === "right"
      ? outerX - measurement.topRowWidth
      : outerX + measurement.topRowWidth;
    const valueX = topRowInnerX;
    const percentX = item.side === "right"
      ? topRowInnerX + measurement.valueWidth + typography.valueGap
      : topRowInnerX - measurement.valueWidth - typography.valueGap;
    const textAlign = item.side === "right" ? "left" : "right";

    ctx.save();
    if (item.active) {
      ctx.shadowColor = hoverColor;
      ctx.shadowBlur = 8;
    }
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = item.active ? lineWidth + 0.5 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(outerX, lineY);
    ctx.lineTo(lineInnerX, lineY);
    ctx.lineTo(item.anchorX, item.anchorY);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = textAlign;
    ctx.textBaseline = "alphabetic";

    this.drawPercentageText(
      ctx,
      item,
      typography,
      measurement.percentWidth,
      percentX,
      percentY,
      accentColor
    );

    ctx.save();
    ctx.globalAlpha = typography.valueOpacity;
    ctx.fillStyle = valueColor;
    ctx.font = typography.wattFlowValue.font;
    ctx.fillText(item.valueText, valueX, valueY);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = typography.textOpacity;
    ctx.fillStyle = labelColor;
    ctx.font = typography.orbitNoteText.font;
    ctx.textAlign = item.side === "right" ? "right" : "left";
    ctx.textBaseline = "middle";
    ctx.fillText(item.labelText, outerX, labelY);
    ctx.restore();
  }

  private measureTextMetrics(
    ctx: CanvasRenderingContext2D,
    font: string,
    text: string
  ): TextMetrics {
    ctx.save();
    ctx.font = font;
    const metrics = ctx.measureText(text);
    ctx.restore();
    return metrics;
  }

  private drawPercentageText(
    ctx: CanvasRenderingContext2D,
    item: LabelLayout,
    typography: DonutConnectorLabelTypography,
    percentWidth: number,
    percentX: number,
    percentY: number,
    accentColor: string
  ): void {
    const scale = item.active ? HOVER_PERCENT_SCALE : 1;
    const anchorX = item.side === "right" ? percentX + percentWidth : percentX - percentWidth;
    const textX = item.side === "right" ? -percentWidth : 0;

    ctx.save();
    ctx.fillStyle = accentColor;
    ctx.font = typography.solarFlarePercent.font;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.translate(anchorX, percentY);
    ctx.scale(scale, scale);
    ctx.fillText(item.percentageText, textX, 0);
    ctx.restore();
  }
}
