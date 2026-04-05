import { LitElement, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { cardStyles } from "./styles";
import "./chart/chartjs-augment";
import "./pv-energy-donut-card-editor";
import { DonutRenderer } from "./chart/donut-renderer";
import type { DonutRenderModel } from "./chart/types";
import { formatHistoryRequestFailed, getTranslations } from "./i18n";
import { formatEnergyValue, getLocale } from "./utils/format";
import { getNumericEntityState } from "./utils/ha-state";
import { calculatePercentages } from "./utils/math";
import { getPeriodRange, isCurrentOpenPeriod, type PeriodUnit } from "./utils/period";
import { getSegmentSourceEntity, type CardMode } from "./utils/segment-source";
import type { HomeAssistant, LovelaceCard, LovelaceCardEditor } from "./types";

interface SegmentConfig {
  entity: string;
  daily_entity?: string;
  label?: string;
  color?: string;
}

interface ChartConfig {
  key?: string;
  title?: string;
  unit?: string;
  segments?: SegmentConfig[];
  no_data_text?: string;
}

interface CardConfig {
  type?: string;
  title?: string;
  locale?: string;
  mode?: "simple" | "time_navigator";
  value_precision?: number;
  total_precision?: number;
  charts?: ChartConfig[];
}

interface NormalizedSegmentConfig {
  entity: string;
  dailyEntity?: string;
  label: string;
  color: string;
}

interface NormalizedChartConfig {
  key: string;
  title: string;
  unit: string;
  noDataText?: string;
  segments: NormalizedSegmentConfig[];
}

interface NormalizedCardConfig {
  title?: string;
  locale?: string;
  mode: CardMode;
  valuePrecision: number;
  totalPrecision: number;
  charts: NormalizedChartConfig[];
}

const DEFAULT_SEGMENT_COLORS = ["#5dade2", "#f5b041", "#58d68d", "#af7ac5", "#ec7063"];
const DEFAULT_UNIT = "kWh";
const CARD_TAG_NAME = "pv-energy-donut-card";

const normalizeCharts = (charts: ChartConfig[] | undefined): NormalizedChartConfig[] =>
  (charts ?? [])
    .slice(0, 2)
    .map((chart, chartIndex) => {
      const title = chart.title?.trim() || `Chart ${chartIndex + 1}`;
      const key = chart.key?.trim() || title.toLowerCase().replace(/\s+/g, "-");
      const segments = (chart.segments ?? [])
        .filter((segment) => Boolean(segment?.entity))
        .map((segment, segmentIndex) => ({
          entity: segment.entity,
          dailyEntity: segment.daily_entity?.trim() || undefined,
          label: segment.label?.trim() || `Segment ${segmentIndex + 1}`,
          color: segment.color?.trim() || DEFAULT_SEGMENT_COLORS[segmentIndex % DEFAULT_SEGMENT_COLORS.length]
        }));

      return {
        key,
        title,
        unit: chart.unit?.trim() || DEFAULT_UNIT,
        noDataText: chart.no_data_text?.trim() || undefined,
        segments
      };
    })
    .filter((chart) => chart.segments.length > 0);

const normalizeConfig = (config: CardConfig): NormalizedCardConfig => ({
  title: config.title?.trim(),
  locale: config.locale?.trim(),
  mode: config.mode === "time_navigator" ? "time_navigator" : "simple",
  valuePrecision: Number.isInteger(config.value_precision) ? Math.max(0, config.value_precision ?? 0) : 1,
  totalPrecision: Number.isInteger(config.total_precision) ? Math.max(0, config.total_precision ?? 0) : 1,
  charts: normalizeCharts(config.charts)
});

@customElement(CARD_TAG_NAME)
export class PvEnergyDonutCard extends LitElement implements LovelaceCard {
  static styles = cardStyles;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement("pv-energy-donut-card-editor") as LovelaceCardEditor;
  }

  public static getStubConfig(): CardConfig {
    return {
      type: `custom:${CARD_TAG_NAME}`,
      title: "PV Energy Overview",
      charts: [
        {
          key: "production",
          title: "Production",
          unit: "kWh",
          segments: [
            {
              entity: "sensor.feed_in_today",
              daily_entity: "sensor.feed_in_today",
              label: "Feed-in",
              color: "#5dade2"
            },
            {
              entity: "sensor.battery_charge_today",
              daily_entity: "sensor.battery_charge_today",
              label: "Battery charge",
              color: "#f5b041"
            },
            {
              entity: "sensor.pv_self_use_today",
              daily_entity: "sensor.pv_self_use_today",
              label: "PV self-consumption",
              color: "#58d68d"
            }
          ]
        }
      ]
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config?: NormalizedCardConfig;

  @state() private configError?: string;

  @state() private periodUnit: PeriodUnit = "day";

  @state() private periodOffset = 0;

  @state() private periodValues = new Map<string, number>();

  @state() private periodLoading = false;

  @state() private periodError?: string;

  @state() private stackPeriodTabs = false;

  private readonly renderers = new Map<string, DonutRenderer>();
  private readonly periodCache = new Map<string, Map<string, number>>();
  private activePeriodRequestKey?: string;
  private resolvedPeriodKey?: string;
  private headerResizeObserver?: ResizeObserver;

  private get ui() {
    return getTranslations(this.hass?.locale?.language);
  }

  public setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") {
      this.configError = "invalid";
      this.config = {
        mode: "simple",
        valuePrecision: 1,
        totalPrecision: 1,
        charts: []
      };
      return;
    }

    const normalized = normalizeConfig(config);
    this.config = normalized;
    this.periodCache.clear();
    this.periodValues = new Map();
    this.periodError = undefined;
    this.periodLoading = false;
    this.periodOffset = 0;
    this.resolvedPeriodKey = undefined;
    this.stackPeriodTabs = false;
    this.configError = normalized.charts.length
      ? undefined
      : "missing_charts";
  }

  public getCardSize(): number {
    return this.config?.charts.length === 2 ? 5 : 3;
  }

  protected render() {
    if (!this.config) {
      return html`
        <ha-card>
          <div class="card-shell">
            <div class="config-error">${this.ui.cardConfigUnavailable}</div>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <div class="card-shell">
          ${this.renderHeader()}
          ${this.config.mode === "time_navigator" ? this.renderPeriodControls() : nothing}
          ${this.configError
            ? html`<div class="config-error">${this.getConfigErrorMessage()}</div>`
            : html`
                <div class="chart-grid" data-chart-count=${String(this.config.charts.length)}>
                  ${this.config.charts.map((chart) => {
                    return html`
                      <section class="chart-panel">
                        <div class="chart-canvas-wrap">
                          <canvas
                            class="chart-canvas"
                            data-chart-key=${chart.key}
                            aria-label=${`${chart.title} donut chart`}
                          ></canvas>
                        </div>
                      </section>
                    `;
                  })}
                </div>
              `}
        </div>
      </ha-card>
    `;
  }

  protected updated(changedProperties: PropertyValues<this>): void {
    if (!this.config || this.configError) {
      this.destroyRenderers();
      this.disconnectHeaderObserver();
      return;
    }

    this.setupHeaderObserver();
    this.measureHeaderLayout();

    const changedKeys = new Set(Array.from(changedProperties.keys(), (key) => String(key)));
    const shouldRefreshPeriodValues =
      changedKeys.has("config") ||
      changedKeys.has("hass") ||
      changedKeys.has("periodUnit") ||
      changedKeys.has("periodOffset") ||
      this.resolvedPeriodKey === undefined;

    if (this.config.mode === "time_navigator" && shouldRefreshPeriodValues) {
      void this.ensurePeriodValues();
    } else {
      this.periodError = undefined;
      this.periodLoading = false;
      this.resolvedPeriodKey = undefined;
    }

    const locale = getLocale(this.hass, this.config.locale);
    const textColor = getComputedStyle(this).getPropertyValue("--pv-card-text").trim() || "#1f2a36";
    const canvases = Array.from(this.renderRoot.querySelectorAll<HTMLCanvasElement>("canvas[data-chart-key]"));
    const activeKeys = new Set(canvases.map((canvas) => canvas.dataset.chartKey ?? ""));
    const renderModels = new Map(this.config.charts.map((chart) => [chart.key, this.createRenderModel(chart)]));

    for (const chart of this.config.charts) {
      const canvas = canvases.find((item) => item.dataset.chartKey === chart.key);
      if (!canvas) {
        continue;
      }

      if (!this.renderers.has(chart.key)) {
        this.renderers.set(chart.key, new DonutRenderer(canvas, locale, textColor));
      }
    }

    const sharedHorizontalPadding = this.config.charts.reduce((maxPadding, chart) => {
      const renderer = this.renderers.get(chart.key);
      const model = renderModels.get(chart.key);
      if (!renderer || !model) {
        return maxPadding;
      }

      return Math.max(maxPadding, renderer.measureHorizontalPadding(model));
    }, 0);

    for (const chart of this.config.charts) {
      const canvas = canvases.find((item) => item.dataset.chartKey === chart.key);
      if (!canvas) {
        continue;
      }

      let renderer = this.renderers.get(chart.key);
      if (!renderer) {
        renderer = new DonutRenderer(canvas, locale, textColor);
        this.renderers.set(chart.key, renderer);
      } else {
        renderer.resize(locale, textColor);
      }

      const model = renderModels.get(chart.key);
      if (!model) {
        continue;
      }

      renderer.update(model, sharedHorizontalPadding);
    }

    for (const [key, renderer] of this.renderers.entries()) {
      if (!activeKeys.has(key)) {
        renderer.destroy();
        this.renderers.delete(key);
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.destroyRenderers();
    this.disconnectHeaderObserver();
  }

  private createRenderModel(chart: NormalizedChartConfig): DonutRenderModel {
    const locale = getLocale(this.hass, this.config?.locale);
    const values = chart.segments.map((segment) => this.getSegmentValue(segment));
    const percentages = calculatePercentages(values);
    const total = values.reduce((sum, value) => sum + value, 0);
    const valuePrecision = this.config?.valuePrecision ?? 1;
    const totalPrecision = this.config?.totalPrecision ?? valuePrecision;
    const data = chart.segments.map((segment, index) => ({
      label: segment.label,
      value: values[index] ?? 0,
      percentage: percentages[index] ?? 0,
      color: segment.color,
      formattedValue: formatEnergyValue(values[index] ?? 0, chart.unit, locale, valuePrecision)
    }));

    return {
      key: chart.key,
      title: chart.title,
      total,
      totalFormatted: formatEnergyValue(total, chart.unit, locale, totalPrecision),
      unit: chart.unit,
      data,
      hasData: total > 0,
      noDataText: chart.noDataText ?? this.ui.noNumericEnergyData
    };
  }

  private getConfigErrorMessage(): string {
    if (this.configError === "invalid") {
      return this.ui.cardConfigInvalid;
    }

    if (this.configError === "missing_charts") {
      return this.ui.addChartsError;
    }

    return this.configError ?? this.ui.cardConfigUnavailable;
  }

  private destroyRenderers(): void {
    for (const renderer of this.renderers.values()) {
      renderer.destroy();
    }

    this.renderers.clear();
  }

  private renderHeader() {
    const showTabs = this.config?.mode === "time_navigator";

    if (!this.config?.title && !showTabs) {
      return nothing;
    }

    return html`
      <div class="card-header">
        ${this.config?.title ? html`<h2 class="card-title">${this.config.title}</h2>` : html`<span></span>`}
        ${showTabs ? this.renderPeriodTabs() : nothing}
      </div>
    `;
  }

  private renderPeriodTabs() {
    const periodTabLabels: Record<PeriodUnit, string> = {
      day: this.ui.day,
      month: this.ui.month,
      year: this.ui.year
    };

    return html`
      <div
        class="period-tabs ${this.stackPeriodTabs ? "stacked" : ""}"
        role="tablist"
        aria-label=${this.ui.periodUnitAriaLabel}
      >
        ${(["day", "month", "year"] as PeriodUnit[]).map(
          (unit, index) => html`
            <button
              class="period-tab ${this.periodUnit === unit ? "active" : ""}"
              type="button"
              role="tab"
              aria-selected=${String(this.periodUnit === unit)}
              @click=${() => this.setPeriodUnit(unit)}
            >
              ${periodTabLabels[unit]}
            </button>
            ${index < 2 ? html`<span class="period-tab-separator">|</span>` : nothing}
          `
        )}
      </div>
    `;
  }

  private setupHeaderObserver(): void {
    if (this.headerResizeObserver) {
      return;
    }

    const header = this.renderRoot.querySelector<HTMLElement>(".card-header");
    if (!header) {
      return;
    }

    this.headerResizeObserver = new ResizeObserver(() => this.measureHeaderLayout());
    this.headerResizeObserver.observe(header);
  }

  private disconnectHeaderObserver(): void {
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = undefined;
  }

  private measureHeaderLayout(): void {
    if (this.config?.mode !== "time_navigator") {
      if (this.stackPeriodTabs) {
        this.stackPeriodTabs = false;
      }
      return;
    }

    const header = this.renderRoot.querySelector<HTMLElement>(".card-header");
    const title = this.renderRoot.querySelector<HTMLElement>(".card-title");
    const tabs = this.renderRoot.querySelector<HTMLElement>(".period-tabs");
    if (!header || !tabs) {
      return;
    }

    const headerWidth = header.getBoundingClientRect().width;
    const titleWidth = title?.getBoundingClientRect().width ?? 0;
    const tabsWidth = tabs.getBoundingClientRect().width;
    const requiredWidth = titleWidth > 0 ? titleWidth + tabsWidth + 20 : tabsWidth;
    const shouldStack = requiredWidth > headerWidth;

    if (this.stackPeriodTabs !== shouldStack) {
      this.stackPeriodTabs = shouldStack;
    }
  }

  private renderPeriodControls() {
    return html`
      <div class="period-toolbar">
        <button
          class="period-nav"
          type="button"
          aria-label=${this.ui.previousPeriodAriaLabel}
          @click=${this.handlePreviousPeriod}
        >
          &#8249;
        </button>
        <div class="period-center">
          <select class="period-select" .value=${String(this.periodOffset)} @change=${this.handlePeriodOffsetChange}>
            ${this.getPeriodOptions().map(
              (option) => html`<option value=${String(option.offset)}>${option.label}</option>`
            )}
          </select>
          ${this.periodError ? html`<div class="period-status error">${this.periodError}</div>` : nothing}
        </div>
        <button
          class="period-nav"
          type="button"
          aria-label=${this.ui.nextPeriodAriaLabel}
          ?disabled=${this.periodOffset === 0}
          @click=${this.handleNextPeriod}
        >
          &#8250;
        </button>
      </div>
    `;
  }

  private handlePreviousPeriod = (): void => {
    this.periodOffset += 1;
  };

  private handleNextPeriod = (): void => {
    this.periodOffset = Math.max(0, this.periodOffset - 1);
  };

  private handlePeriodOffsetChange = (event: Event): void => {
    const select = event.target as HTMLSelectElement;
    const nextOffset = Number.parseInt(select.value, 10);
    this.periodOffset = Number.isFinite(nextOffset) ? Math.max(0, nextOffset) : 0;
  };

  private setPeriodUnit(unit: PeriodUnit): void {
    if (this.periodUnit === unit) {
      return;
    }

    this.periodUnit = unit;
    this.periodOffset = 0;
  }

  private getPeriodOptions(): Array<{ offset: number; label: string }> {
    const locale = getLocale(this.hass, this.config?.locale);
    const count = this.periodUnit === "year" ? 8 : this.periodUnit === "month" ? 18 : 21;

    return Array.from({ length: count }, (_, offset) => ({
      offset,
      label: this.getCurrentPeriodLabelForOffset(locale, offset)
    }));
  }

  private getCurrentPeriodLabelForOffset(locale: string, offset: number): string {
    const { start } = this.getSelectedPeriodRange(offset);
    if (this.periodUnit === "year") {
      return new Intl.DateTimeFormat(locale, { year: "numeric" }).format(start);
    }
    if (this.periodUnit === "month") {
      return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(start);
    }
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(start);
  }

  private getSelectedPeriodRange(offset = this.periodOffset): { start: Date; end: Date; key: string } {
    return getPeriodRange(this.periodUnit, offset, new Date(), this.getTrackedEntities());
  }

  private getTrackedEntities(): string[] {
    if (!this.config) {
      return [];
    }

    return [...new Set(this.config.charts.flatMap((chart) => chart.segments.map((segment) => segment.entity)))];
  }

  private isCurrentOpenPeriod(): boolean {
    return isCurrentOpenPeriod(this.periodOffset);
  }

  private getSegmentValue(segment: NormalizedSegmentConfig): number {
    if (this.config?.mode === "simple" || (this.periodUnit === "day" && this.periodOffset === 0 && segment.dailyEntity)) {
      return getNumericEntityState(
        this.hass,
        getSegmentSourceEntity({
          mode: this.config?.mode ?? "simple",
          periodUnit: this.periodUnit,
          periodOffset: this.periodOffset,
          entity: segment.entity,
          dailyEntity: segment.dailyEntity
        })
      );
    }

    return this.periodValues.get(segment.entity) ?? 0;
  }

  private async ensurePeriodValues(): Promise<void> {
    if (!this.config || this.config.mode !== "time_navigator") {
      return;
    }

    const entities = this.getTrackedEntities();
    if (!entities.length) {
      this.periodValues = new Map();
      this.periodError = undefined;
      return;
    }

    const { start, end, key } = this.getSelectedPeriodRange();
    const canUseCache = !this.isCurrentOpenPeriod();
    const cached = canUseCache ? this.periodCache.get(key) : undefined;
    if (cached) {
      if (this.resolvedPeriodKey === key) {
        return;
      }
      this.periodValues = new Map(cached);
      this.periodLoading = false;
      this.periodError = undefined;
      this.resolvedPeriodKey = key;
      return;
    }

    if (this.activePeriodRequestKey === key) {
      return;
    }

    this.activePeriodRequestKey = key;
    this.periodLoading = true;
    this.periodError = undefined;

    try {
      const values = await this.fetchPeriodValues(entities, start, end);
      if (this.activePeriodRequestKey !== key) {
        return;
      }

      if (canUseCache) {
        this.periodCache.set(key, values);
      }
      this.periodValues = new Map(values);
      this.periodLoading = false;
      this.resolvedPeriodKey = key;
    } catch (error) {
      if (this.activePeriodRequestKey !== key) {
        return;
      }

      this.periodLoading = false;
      this.periodError = error instanceof Error ? error.message : "Could not load period data.";
    } finally {
      if (this.activePeriodRequestKey === key) {
        this.activePeriodRequestKey = undefined;
      }
    }
  }

  private async fetchPeriodValues(entities: string[], start: Date, end: Date): Promise<Map<string, number>> {
    const statisticsValues = await this.fetchStatisticsPeriodValues(entities, start, end);
    if (statisticsValues) {
      return statisticsValues;
    }

    const values = new Map<string, number>(entities.map((entityId) => [entityId, 0]));
    const query = new URLSearchParams({
      filter_entity_id: entities.join(","),
      end_time: end.toISOString(),
      minimal_response: "",
      no_attributes: ""
    });
    const response = await fetch(`/api/history/period/${encodeURIComponent(start.toISOString())}?${query.toString()}`, {
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error(formatHistoryRequestFailed(response.status, this.hass?.locale?.language));
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return values;
    }

    for (const series of payload) {
      if (!Array.isArray(series) || series.length === 0) {
        continue;
      }

      const entityId = series.find(
        (entry): entry is { entity_id: string } =>
          Boolean(entry) && typeof entry === "object" && typeof (entry as { entity_id?: unknown }).entity_id === "string"
      )?.entity_id;

      if (!entityId || !values.has(entityId)) {
        continue;
      }

      let previousValue: number | undefined;
      let totalDelta = 0;

      for (const entry of series) {
        const rawState = typeof entry === "object" && entry ? (entry as { state?: unknown }).state : undefined;
        const numericValue = typeof rawState === "string" ? Number.parseFloat(rawState) : Number.NaN;
        if (!Number.isFinite(numericValue)) {
          continue;
        }

        if (previousValue !== undefined) {
          const diff = numericValue - previousValue;
          if (diff > 0) {
            totalDelta += diff;
          }
        }

        previousValue = numericValue;
      }

      values.set(entityId, totalDelta);
    }

    return values;
  }

  private async fetchStatisticsPeriodValues(
    entities: string[],
    start: Date,
    end: Date
  ): Promise<Map<string, number> | undefined> {
    if (!this.hass?.callWS) {
      return undefined;
    }

    const period = this.periodUnit === "year" ? "month" : this.periodUnit === "month" ? "day" : "hour";

    try {
      const result = await this.hass.callWS<Record<string, Array<Record<string, unknown>>>>({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        statistic_ids: entities,
        period,
        types: ["change", "sum", "state"]
      });

      const values = new Map<string, number>(entities.map((entityId) => [entityId, 0]));

      for (const entityId of entities) {
        const rows = result?.[entityId];
        if (!Array.isArray(rows) || !rows.length) {
          continue;
        }

        let totalChange = 0;
        let hasChange = false;
        let firstCumulative: number | undefined;
        let lastCumulative: number | undefined;

        for (const row of rows) {
          const change = typeof row.change === "number" ? row.change : Number.NaN;
          if (Number.isFinite(change)) {
            totalChange += change;
            hasChange = true;
          }

          const sum = typeof row.sum === "number" ? row.sum : Number.NaN;
          const state = typeof row.state === "number" ? row.state : Number.NaN;
          const cumulative = Number.isFinite(sum) ? sum : state;
          if (Number.isFinite(cumulative)) {
            if (firstCumulative === undefined) {
              firstCumulative = cumulative;
            }
            lastCumulative = cumulative;
          }
        }

        if (hasChange) {
          values.set(entityId, totalChange);
          continue;
        }

        if (firstCumulative !== undefined && lastCumulative !== undefined) {
          values.set(entityId, Math.max(0, lastCumulative - firstCumulative));
        }
      }

      return values;
    } catch {
      return undefined;
    }
  }
}

if (!window.customCards) {
  window.customCards = [];
}

window.customCards.push({
  type: `custom:${CARD_TAG_NAME}`,
  name: "PV Energy Donut Card",
  description: "Photovoltaic production and consumption donut charts with external callout labels.",
  preview: true
});
