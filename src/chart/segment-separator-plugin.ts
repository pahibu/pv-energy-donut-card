import type { ArcElement, Chart, Plugin } from "chart.js";

const readCssNumber = (
  styles: CSSStyleDeclaration,
  propertyName: string,
  fallback: number
): number => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName).trim());
  return Number.isFinite(value) ? value : fallback;
};

export const segmentSeparatorPlugin: Plugin<"doughnut"> = {
  id: "pvEnergySegmentSeparators",
  afterDatasetsDraw(chart: Chart<"doughnut">) {
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) {
      return;
    }

    const arcs = meta.data.filter((element) => {
      const arc = element as ArcElement;
      return (arc.circumference ?? 0) > 0;
    }) as ArcElement[];

    if (arcs.length <= 1) {
      return;
    }

    const styles = getComputedStyle(chart.canvas);
    const separatorWidth = readCssNumber(styles, "--pv-chart-separator-width", 5);
    const minimumSegmentWidth = readCssNumber(styles, "--pv-chart-min-segment-width", 0.5);

    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = separatorWidth;
    ctx.lineCap = "butt";

    const minimumVisibleArc = minimumSegmentWidth;
    const minimumRequiredArc = minimumSegmentWidth + separatorWidth * 2;
    const arcLengths = arcs.map((arc) => {
      const midRadius = (arc.innerRadius + arc.outerRadius) / 2;
      return arc.circumference * midRadius;
    });

    for (const [index, arc] of arcs.entries()) {
      const previousIndex = index === 0 ? arcs.length - 1 : index - 1;
      const currentArcLength = arcLengths[index] ?? 0;
      const previousArcLength = arcLengths[previousIndex] ?? 0;
      const effectiveSeparatorWidth = Math.min(
        separatorWidth,
        Math.max(0, (currentArcLength - minimumVisibleArc) / 2),
        Math.max(0, (previousArcLength - minimumVisibleArc) / 2)
      );

      if (currentArcLength < minimumRequiredArc || previousArcLength < minimumRequiredArc) {
        if (effectiveSeparatorWidth <= 0) {
          continue;
        }
      }

      const angle = arc.startAngle;
      const innerRadius = Math.max(0, arc.innerRadius - effectiveSeparatorWidth * 0.35);
      const outerRadius = arc.outerRadius + effectiveSeparatorWidth * 0.35;
      const startX = arc.x + Math.cos(angle) * innerRadius;
      const startY = arc.y + Math.sin(angle) * innerRadius;
      const endX = arc.x + Math.cos(angle) * outerRadius;
      const endY = arc.y + Math.sin(angle) * outerRadius;

      ctx.lineWidth = effectiveSeparatorWidth;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }
};
