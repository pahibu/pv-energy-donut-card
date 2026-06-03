import type { Chart, Plugin } from "chart.js";

export interface CenterLabelTypography {
  titleSize: number;
  totalSize: number;
}

interface CenterLabelPluginOptions {
  title: string;
  totalFormatted: string;
  typography?: CenterLabelTypography;
}

interface CenterLabelTypographyInput {
  ctx: CanvasRenderingContext2D;
  styles: CSSStyleDeclaration;
  title: string;
  totalFormatted: string;
  reference: number;
}

const FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";
const runtimeMeta = new WeakMap<Chart<"doughnut">, CenterLabelPluginOptions>();
const hoverState = new WeakMap<Chart<"doughnut">, boolean>();

export const setCenterLabelRuntimeMeta = (
  chart: Chart<"doughnut">,
  options: CenterLabelPluginOptions
): void => {
  runtimeMeta.set(chart, options);
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const readCssNumber = (
  styles: CSSStyleDeclaration,
  propertyName: string,
  fallback: number
): number => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
  return Number.isFinite(value) ? value : fallback;
};

const fitFontSizeToWidth = (
  ctx: CanvasRenderingContext2D,
  text: string,
  fontWeight: number,
  maxWidth: number,
  initialSize: number,
  minSize: number
): number => {
  let size = initialSize;

  while (size > minSize) {
    ctx.font = `${fontWeight} ${size}px ${FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }

  return minSize;
};

export const resolveCenterLabelTypography = ({
  ctx,
  styles,
  title,
  totalFormatted,
  reference
}: CenterLabelTypographyInput): CenterLabelTypography => {
  const titleScale = readCssNumber(styles, "--pv-center-title-scale", 1);
  const titleMin = readCssNumber(styles, "--pv-center-title-min", 8);
  const titleMax = readCssNumber(styles, "--pv-center-title-max", 15);
  const totalScale = readCssNumber(styles, "--pv-center-total-scale", 1);
  const totalMin = readCssNumber(styles, "--pv-center-total-min", 14);
  const totalMax = readCssNumber(styles, "--pv-center-total-max", 34);
  const titleSize = clamp(reference * 0.045 * titleScale, titleMin, titleMax);
  const desiredTotalSize = clamp(reference * 0.12 * totalScale, totalMin, totalMax);
  const innerDiameter = reference * 0.76;
  const maxTextWidth = innerDiameter * 0.82;
  const titleText = title.toUpperCase();
  const totalSize = fitFontSizeToWidth(ctx, totalFormatted, 800, maxTextWidth, desiredTotalSize, totalMin);
  const fittedTitleSize = fitFontSizeToWidth(
    ctx,
    titleText,
    600,
    maxTextWidth * 0.88,
    Math.min(titleSize, totalSize * 0.42),
    titleMin
  );

  return {
    titleSize: fittedTitleSize,
    totalSize
  };
};

export const mergeCenterLabelTypographies = (
  typographies: CenterLabelTypography[]
): CenterLabelTypography | undefined => {
  if (!typographies.length) {
    return undefined;
  }

  const totalSize = Math.min(...typographies.map((item) => item.totalSize));
  return {
    totalSize,
    titleSize: Math.min(
      ...typographies.map((item) => item.titleSize),
      totalSize * 0.42
    )
  };
};

const resolveTypographyForChart = (
  chart: Chart<"doughnut">,
  title: string,
  totalFormatted: string,
  override?: CenterLabelTypography
): CenterLabelTypography | undefined => {
  if (override) {
    return override;
  }

  const { chartArea, ctx, canvas } = chart;
  if (!chartArea) {
    return undefined;
  }

  return resolveCenterLabelTypography({
    ctx,
    styles: getComputedStyle(canvas),
    title,
    totalFormatted,
    reference: Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top)
  });
};

export const centerLabelPlugin: Plugin<"doughnut", CenterLabelPluginOptions> = {
  id: "pvEnergyCenterLabel",
  afterEvent(chart: Chart<"doughnut">, args) {
    const event = args.event;
    const chartArea = chart.chartArea;
    if (!chartArea) {
      return;
    }

    const runtimeOptions = runtimeMeta.get(chart);
    const title = runtimeOptions?.title?.trim();
    const totalFormatted = runtimeOptions?.totalFormatted?.trim();
    if (!title || !totalFormatted) {
      return;
    }

    if (event.type === "mouseout") {
      if (hoverState.get(chart)) {
        hoverState.set(chart, false);
        args.changed = true;
      }
      return;
    }

    if (event.x === null || event.y === null) {
      return;
    }

    const typography = resolveTypographyForChart(chart, title, totalFormatted, runtimeOptions?.typography);
    if (!typography) {
      return;
    }

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const titleText = title.toUpperCase();
    const ctx = chart.ctx;

    ctx.save();
    ctx.font = `600 ${typography.titleSize}px ${FONT_FAMILY}`;
    const titleWidth = ctx.measureText(titleText).width;
    const titleY = centerY - typography.totalSize * 0.7;
    const totalY = centerY + typography.totalSize * 0.18;
    ctx.font = `800 ${typography.totalSize}px ${FONT_FAMILY}`;
    const totalWidth = ctx.measureText(totalFormatted).width;
    ctx.restore();

    const boxLeft = centerX - Math.max(titleWidth, totalWidth) / 2 - 6;
    const boxRight = centerX + Math.max(titleWidth, totalWidth) / 2 + 6;
    const boxTop = titleY - typography.titleSize * 0.8;
    const boxBottom = totalY + typography.totalSize * 0.4;
    const isHoveringCenter =
      event.x >= boxLeft &&
      event.x <= boxRight &&
      event.y >= boxTop &&
      event.y <= boxBottom;

    if (hoverState.get(chart) !== isHoveringCenter) {
      hoverState.set(chart, isHoveringCenter);
      args.changed = true;
    }
  },
  afterDatasetsDraw(chart: Chart<"doughnut">) {
    const { ctx, chartArea, canvas } = chart;
    if (!chartArea) {
      return;
    }

    const runtimeOptions = runtimeMeta.get(chart);
    const title = runtimeOptions?.title?.trim();
    const totalFormatted = runtimeOptions?.totalFormatted?.trim();
    if (!title || !totalFormatted) {
      return;
    }

    const typography = resolveTypographyForChart(chart, title, totalFormatted, runtimeOptions?.typography);
    if (!typography) {
      return;
    }

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const styles = getComputedStyle(canvas);
    const titleColor = styles.getPropertyValue("--pv-card-muted").trim() || "#8ca0b6";
    const totalColor = styles.getPropertyValue("--pv-card-title").trim() || "#f5f7fb";
    const titleText = title.toUpperCase();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = titleColor;
    ctx.font = `600 ${typography.titleSize}px ${FONT_FAMILY}`;
    ctx.letterSpacing = "0.08em";
    ctx.fillText(titleText, centerX, centerY - typography.totalSize * 0.7);

    ctx.fillStyle = totalColor;
    ctx.font = `800 ${typography.totalSize}px ${FONT_FAMILY}`;
    ctx.fillText(totalFormatted, centerX, centerY + typography.totalSize * 0.18);

    ctx.restore();
  }
};
