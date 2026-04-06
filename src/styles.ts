import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
    --pv-card-background: var(--ha-card-background, var(--card-background-color, var(--card-background-color, #ffffff)));
    --pv-card-border: var(--ha-card-border-color, var(--divider-color, rgba(127, 127, 127, 0.2)));
    --pv-card-title: var(--primary-text-color, #1f2a36);
    --pv-card-text: var(--primary-text-color, #1f2a36);
    --pv-card-muted: var(--secondary-text-color, #5f7388);
    --pv-card-ring: var(--divider-color, rgba(127, 127, 127, 0.14));
    --pv-card-overlay: color-mix(in srgb, var(--pv-card-title) 4%, transparent);
    --pv-card-overlay-strong: color-mix(in srgb, var(--pv-card-title) 8%, transparent);
    --pv-card-divider: color-mix(in srgb, var(--pv-card-title) 10%, transparent);
    --pv-card-error-text: var(--error-color, var(--state-error-color, #b3261e));
    --pv-card-error-background: color-mix(in srgb, var(--pv-card-error-text) 12%, transparent);
    --pv-card-error-border: color-mix(in srgb, var(--pv-card-error-text) 24%, transparent);
    --pv-card-shadow: var(--ha-card-box-shadow, 0 18px 40px rgba(2, 8, 18, 0.26));
    --pv-chart-min-width: 400px;
    --pv-center-title-scale: 1;
    --pv-center-title-min: 8;
    --pv-center-title-max: 16;
    --pv-center-total-scale: 1;
    --pv-center-total-min: 12;
    --pv-center-total-max: 36;
    --pv-label-percent-scale: 1.2;
    --pv-label-percent-min: 12;
    --pv-label-percent-max: 36;
    --pv-label-value-scale: 1.1;
    --pv-label-value-min: 10;
    --pv-label-value-max: 18;
    --pv-label-text-scale: 1.1;
    --pv-label-text-min: 10;
    --pv-label-text-max: 18;
    --pv-label-line-width: 1;
    --pv-chart-padding-y: 20;
    --pv-chart-min-segment-width: 1;
    --pv-chart-separator-width: 5;
  }

  ha-card {
    display: block;
    container-type: inline-size;
    color: var(--pv-card-text);
    overflow: hidden;
  }

  :host([preview-theme]) ha-card {
    background: var(--pv-card-background);
    border: 1px solid var(--pv-card-border);
    border-radius: var(--ha-card-border-radius, 24px);
    box-shadow: var(--pv-card-shadow);
  }

  .card-shell {
    padding: 20px 20px 18px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px 20px;
    flex-wrap: wrap;
    margin: 0 0 18px;
  }

  .card-title {
    margin: 0;
    color: var(--pv-card-title);
    font-size: 1.18rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .period-toolbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin: 0 0 18px;
  }

  .period-center {
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  .period-tabs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .period-tabs.stacked {
    width: 100%;
    justify-content: center;
    margin-left: 0;
  }

  .period-tab {
    min-width: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--pv-card-muted);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .period-tab.active {
    color: var(--pv-card-title);
    font-weight: 500;
  }

  .period-tab-separator {
    color: var(--pv-card-muted);
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1;
    user-select: none;
  }

  .period-select {
    min-width: 0;
    width: auto;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--pv-card-text);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 500;
    text-align: center;
    text-align-last: center;
    letter-spacing: 0.01em;
    opacity: 0.9;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }

  .period-nav {
    width: 36px;
    height: 36px;
    border: 1px solid var(--pv-card-divider);
    border-radius: 999px;
    background: var(--pv-card-overlay);
    color: var(--pv-card-title);
    font: inherit;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
  }

  .period-nav[disabled] {
    opacity: 0.4;
    cursor: default;
  }

  .period-status {
    color: var(--pv-card-muted);
    font-size: 0.78rem;
    text-align: center;
  }

  .period-status.error {
    color: var(--pv-card-error-text);
  }

  .chart-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--pv-chart-min-width)), 1fr));
  }

  .chart-panel {
    position: relative;
    min-height: 280px;
    min-width: 0;
  }

  .chart-canvas-wrap {
    position: relative;
    isolation: isolate;
    min-height: 280px;
  }

  .chart-grid[data-chart-count="2"] .chart-panel + .chart-panel::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -8px;
    width: 1px;
    background: var(--pv-card-divider);
  }

  .chart-canvas {
    position: relative;
    display: block;
    width: 100%;
    height: 280px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    color: var(--pv-card-muted);
    text-align: center;
    font-size: 0.92rem;
    border: 1px dashed var(--pv-card-divider);
    border-radius: 16px;
    background: var(--pv-card-overlay);
  }

  .config-error {
    padding: 16px;
    color: var(--pv-card-error-text);
    background: var(--pv-card-error-background);
    border: 1px solid var(--pv-card-error-border);
    border-radius: 16px;
    font-size: 0.94rem;
  }

  @container (max-width: 860px) {
    .card-shell {
      padding: 16px;
    }

    .period-toolbar {
      gap: 8px;
    }

    .period-select {
      min-width: 148px;
    }

    .chart-grid {
      grid-template-columns: 1fr;
    }

    .chart-panel {
      min-height: 280;
    }

    .chart-canvas-wrap {
      min-height: 280px;
    }

    .chart-canvas {
      height: 280px;
    }

    .chart-grid[data-chart-count="2"] .chart-panel + .chart-panel {
      padding: 0;
    }

    .chart-grid[data-chart-count="2"] .chart-panel + .chart-panel::before {
      top: -8px;
      right: 0;
      bottom: auto;
      left: 0;
      width: auto;
      height: 1px;
    }
  }
`;
