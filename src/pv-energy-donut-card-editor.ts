import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { getTranslations } from "./i18n";
import type { HomeAssistant, LovelaceCardEditor } from "./types";

interface SegmentConfig {
  entity?: string;
  daily_entity?: string;
  label?: string;
  color?: string;
}

interface ChartConfig {
  key?: string;
  title?: string;
  unit?: string;
  segments?: SegmentConfig[];
}

interface CardConfig {
  type?: string;
  title?: string;
  locale?: string;
  mode?: "simple" | "time_navigator";
  ring_size?: "thin" | "airy" | "balanced" | "bold";
  segment_spacing?: "relaxed" | "compact" | "none";
  value_precision?: number;
  total_precision?: number;
  charts?: ChartConfig[];
}

const DEFAULT_SEGMENT_COLORS = ["#5dade2", "#f5b041", "#58d68d", "#af7ac5", "#ec7063", "#ec7063"];

const createDefaultSegment = (index: number): SegmentConfig => ({
  entity: "",
  daily_entity: "",
  label: `Segment ${index + 1}`,
  color: DEFAULT_SEGMENT_COLORS[index % DEFAULT_SEGMENT_COLORS.length]
});

const createDefaultChart = (index: number): ChartConfig => ({
  key: index === 0 ? "production" : "consumption",
  title: index === 0 ? "Production" : "Consumption",
  unit: "kWh",
  segments: [createDefaultSegment(0), createDefaultSegment(1), createDefaultSegment(2)]
});

@customElement("pv-energy-donut-card-editor")
export class PvEnergyDonutCardEditor extends LitElement implements LovelaceCardEditor {
  static styles = css`
    :host {
      display: block;
      padding: 8px 0 16px;
    }

    .stack {
      display: grid;
      gap: 16px;
    }

    .card,
    .segment {
      min-width: 0;
      padding: 14px;
      border: 1px solid rgba(127, 127, 127, 0.24);
      border-radius: 14px;
      background: rgba(127, 127, 127, 0.06);
    }

    .section-title {
      margin: 0 0 10px;
      font-size: 1rem;
      font-weight: 700;
    }

    .row {
      display: grid;
      gap: 10px;
      margin-top: 10px;
      min-width: 0;
    }

    .row.two {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 0;
    }

    input,
    select,
    button {
      font: inherit;
    }

    input,
    select {
      width: 100%;
      max-width: 100%;
      height: 40px;
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid rgba(127, 127, 127, 0.28);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #111);
      box-sizing: border-box;
    }

    input[type="color"] {
      padding: 4px;
      min-width: 52px;
      height: 40px;
    }

    .segment-list {
      display: grid;
      gap: 12px;
      margin-top: 12px;
      min-width: 0;
    }

    .segment-header,
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 12px;
      min-width: 0;
    }

    button {
      border: 1px solid rgba(127, 127, 127, 0.28);
      border-radius: 999px;
      padding: 8px 12px;
      background: transparent;
      color: var(--primary-text-color, #111);
      cursor: pointer;
    }

    button[disabled] {
      opacity: 0.45;
      cursor: default;
    }
  `;

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config: CardConfig = {
    type: "custom:pv-energy-donut-card",
    mode: "simple",
    ring_size: "balanced",
    segment_spacing: "relaxed",
    title: "",
    charts: [createDefaultChart(0)]
  };

  @state() private hasEntityPicker = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.hasEntityPicker = Boolean(customElements.get("ha-entity-picker"));
    if (!this.hasEntityPicker) {
      customElements.whenDefined("ha-entity-picker").then(() => {
        this.hasEntityPicker = true;
      });
    }
  }

  public setConfig(config: CardConfig): void {
    this.config = {
      type: "custom:pv-energy-donut-card",
      title: config?.title ?? "",
      locale: config?.locale,
      mode: config?.mode === "time_navigator" ? "time_navigator" : "simple",
      ring_size:
        config?.ring_size === "thin" || config?.ring_size === "airy" || config?.ring_size === "bold"
          ? config.ring_size
          : "balanced",
      segment_spacing:
        config?.segment_spacing === "compact" || config?.segment_spacing === "none"
          ? config.segment_spacing
          : "relaxed",
      value_precision: config?.value_precision,
      total_precision: config?.total_precision,
      charts: (config?.charts?.length ? config.charts : [createDefaultChart(0)]).map((chart, chartIndex) => ({
        key: chart.key ?? (chartIndex === 0 ? "production" : "consumption"),
        title: chart.title ?? (chartIndex === 0 ? "Production" : "Consumption"),
        unit: chart.unit ?? "kWh",
        segments: (chart.segments?.length ? chart.segments : [createDefaultSegment(0)]).slice(0, 6).map((segment) => ({
          entity: segment.entity ?? "",
          daily_entity: segment.daily_entity ?? "",
          label: segment.label ?? "",
          color: segment.color ?? ""
        }))
      }))
    };
  }

  private get ui() {
    return getTranslations(this.hass?.locale?.language);
  }

  protected render() {
    const charts = this.config.charts ?? [createDefaultChart(0)];

    return html`
      <div class="stack">
        <div class="card">
          <div class="section-title">${this.ui.cardEditorSection}</div>
          <div class="row two">
            <label>
              ${this.ui.cardTitleField}
              <input
                .value=${this.config.title ?? ""}
                @input=${(event: InputEvent) => this.updateRootField("title", event)}
              />
            </label>
            <label>
              ${this.ui.chartsField}
              <select .value=${String(charts.length)} @change=${this.handleChartCountChange}>
                <option value="1">1 chart</option>
                <option value="2">2 charts</option>
              </select>
            </label>
            <label>
              ${this.ui.modeField}
              <select .value=${this.config.mode ?? "simple"} @change=${this.handleModeChange}>
                <option value="simple">${this.ui.simpleMode}</option>
                <option value="time_navigator">${this.ui.timeNavigatorMode}</option>
              </select>
            </label>
            <label>
              ${this.ui.ringSizeField}
              <select .value=${this.config.ring_size ?? "balanced"} @change=${this.handleRingSizeChange}>
                <option value="thin">${this.ui.thinRing}</option>
                <option value="airy">${this.ui.airyRing}</option>
                <option value="balanced">${this.ui.balancedRing}</option>
                <option value="bold">${this.ui.boldRing}</option>
              </select>
            </label>
            <label>
              ${this.ui.segmentSpacingField}
              <select .value=${this.config.segment_spacing ?? "relaxed"} @change=${this.handleSegmentSpacingChange}>
                <option value="relaxed">${this.ui.largeSpacing}</option>
                <option value="compact">${this.ui.mediumSpacing}</option>
                <option value="none">${this.ui.noSpacing}</option>
              </select>
            </label>
          </div>
        </div>

        ${charts.map((chart, chartIndex) => this.renderChart(chart, chartIndex))}
      </div>
    `;
  }

  private renderChart(chart: ChartConfig, chartIndex: number) {
    const segments = chart.segments ?? [];

    return html`
      <div class="card">
        <div class="chart-header">
          <div class="section-title">${this.ui.chartField} ${chartIndex + 1}</div>
        </div>
        <div class="row two">
          <label>
            ${this.ui.keyField}
            <input .value=${chart.key ?? ""} @input=${(event: InputEvent) => this.updateChartField(chartIndex, "key", event)} />
          </label>
          <label>
            ${this.ui.titleField}
            <input .value=${chart.title ?? ""} @input=${(event: InputEvent) => this.updateChartField(chartIndex, "title", event)} />
          </label>
        </div>
        <div class="row two">
          <label>
            ${this.ui.unitField}
            <input .value=${chart.unit ?? "kWh"} @input=${(event: InputEvent) => this.updateChartField(chartIndex, "unit", event)} />
          </label>
        </div>

        <div class="segment-list">
          ${segments.map((segment, segmentIndex) => this.renderSegment(chartIndex, segmentIndex, segment))}
        </div>

        <div class="actions">
          <button ?disabled=${segments.length >= 6} @click=${() => this.addSegment(chartIndex)}>${this.ui.addSegment}</button>
        </div>
      </div>
    `;
  }

  private renderSegment(chartIndex: number, segmentIndex: number, segment: SegmentConfig) {
    return html`
      <div class="segment">
        <div class="segment-header">
          <strong>${this.ui.segmentField} ${segmentIndex + 1}</strong>
          <button @click=${() => this.removeSegment(chartIndex, segmentIndex)}>${this.ui.remove}</button>
        </div>
        <div class="row">
          <label>
            ${this.ui.entityField}
            ${this.renderEntityField(chartIndex, segmentIndex, segment.entity ?? "")}
          </label>
        </div>
        <div class="row">
          <label>
            ${this.ui.dailyEntityField}
            ${this.renderDailyEntityField(chartIndex, segmentIndex, segment.daily_entity ?? "")}
          </label>
        </div>
        <div class="row two">
          <label>
            ${this.ui.labelField}
            <input
              .value=${segment.label ?? ""}
              @input=${(event: InputEvent) => this.updateSegmentField(chartIndex, segmentIndex, "label", event)}
            />
          </label>
          <label>
            ${this.ui.colorField}
            <input
              type="color"
              .value=${segment.color ?? DEFAULT_SEGMENT_COLORS[segmentIndex % DEFAULT_SEGMENT_COLORS.length]}
              @input=${(event: InputEvent) => this.updateSegmentField(chartIndex, segmentIndex, "color", event)}
            />
          </label>
        </div>
      </div>
    `;
  }

  private renderEntityField(chartIndex: number, segmentIndex: number, value: string) {
    const listId = `entity-list-${chartIndex}-${segmentIndex}`;

    return html`
      <input
        list=${listId}
        .value=${value}
        @input=${(event: InputEvent) => this.updateSegmentField(chartIndex, segmentIndex, "entity", event)}
      />
      <datalist id=${listId}>
        ${(this.hass ? Object.keys(this.hass.states) : []).map(
          (entityId) => html`<option value=${entityId}></option>`
        )}
      </datalist>
    `;
  }

  private renderDailyEntityField(chartIndex: number, segmentIndex: number, value: string) {
    const listId = `daily-entity-list-${chartIndex}-${segmentIndex}`;

    return html`
      <input
        list=${listId}
        .value=${value}
        placeholder=${this.ui.dailyEntityPlaceholder}
        @input=${(event: InputEvent) => this.updateSegmentField(chartIndex, segmentIndex, "daily_entity", event)}
      />
      <datalist id=${listId}>
        ${(this.hass ? Object.keys(this.hass.states) : []).map(
          (entityId) => html`<option value=${entityId}></option>`
        )}
      </datalist>
    `;
  }

  private handleChartCountChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const count = Number.parseInt(select.value, 10);
    const currentCharts = [...(this.config.charts ?? [createDefaultChart(0)])];
    const nextCharts =
      count === 2
        ? [...currentCharts, createDefaultChart(1)].slice(0, 2)
        : currentCharts.slice(0, 1);

    this.emitConfig({
      ...this.config,
      charts: nextCharts
    });
  }

  private updateRootField(field: "title", event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    this.emitConfig({
      ...this.config,
      [field]: input.value
    });
  }

  private handleModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.emitConfig({
      ...this.config,
      mode: select.value === "time_navigator" ? "time_navigator" : "simple"
    });
  }

  private handleSegmentSpacingChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const segmentSpacing =
      select.value === "compact" || select.value === "none" ? select.value : "relaxed";
    this.emitConfig({
      ...this.config,
      segment_spacing: segmentSpacing
    });
  }

  private handleRingSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ringSize =
      select.value === "thin" || select.value === "airy" || select.value === "bold" ? select.value : "balanced";
    this.emitConfig({
      ...this.config,
      ring_size: ringSize
    });
  }

  private updateChartField(chartIndex: number, field: keyof ChartConfig, event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    const charts = [...(this.config.charts ?? [])];
    charts[chartIndex] = {
      ...charts[chartIndex],
      [field]: input.value
    };
    this.emitConfig({
      ...this.config,
      charts
    });
  }

  private updateSegmentField(
    chartIndex: number,
    segmentIndex: number,
    field: keyof SegmentConfig,
    event: InputEvent
  ): void {
    const input = event.target as HTMLInputElement;
    this.updateSegmentValue(chartIndex, segmentIndex, field, input.value);
  }

  private updateSegmentValue(
    chartIndex: number,
    segmentIndex: number,
    field: keyof SegmentConfig,
    value: string
  ): void {
    const charts = [...(this.config.charts ?? [])];
    const chart = charts[chartIndex] ?? createDefaultChart(chartIndex);
    const segments = [...(chart.segments ?? [])];
    segments[segmentIndex] = {
      ...segments[segmentIndex],
      [field]: value
    };
    charts[chartIndex] = {
      ...chart,
      segments
    };
    this.emitConfig({
      ...this.config,
      charts
    });
  }

  private addSegment(chartIndex: number): void {
    const charts = [...(this.config.charts ?? [])];
    const chart = charts[chartIndex] ?? createDefaultChart(chartIndex);
    const segments = [...(chart.segments ?? [])];
    if (segments.length >= 6) {
      return;
    }

    segments.push(createDefaultSegment(segments.length));
    charts[chartIndex] = {
      ...chart,
      segments
    };
    this.emitConfig({
      ...this.config,
      charts
    });
  }

  private removeSegment(chartIndex: number, segmentIndex: number): void {
    const charts = [...(this.config.charts ?? [])];
    const chart = charts[chartIndex];
    if (!chart) {
      return;
    }

    const segments = [...(chart.segments ?? [])];
    segments.splice(segmentIndex, 1);
    charts[chartIndex] = {
      ...chart,
      segments
    };
    this.emitConfig({
      ...this.config,
      charts
    });
  }

  private emitConfig(config: CardConfig): void {
    this.config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true
      })
    );
  }
}
