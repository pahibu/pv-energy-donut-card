export interface HomeAssistantEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HomeAssistantEntityState>;
  locale?: {
    language?: string;
    number_format?: string;
  };
  callWS?<T>(message: Record<string, unknown>): Promise<T>;
}

export interface LovelaceCardEditor extends HTMLElement {
  setConfig?(config: unknown): void;
}

export interface LovelaceCardGridOptions {
  rows?: number;
  columns?: number | "full";
  min_rows?: number;
  max_rows?: number;
  min_columns?: number;
  max_columns?: number;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: unknown): void;
  getCardSize(): number;
  getGridOptions(): LovelaceCardGridOptions;
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview: boolean;
    }>;
  }

  interface HTMLElementTagNameMap {
    "pv-energy-donut-card": LovelaceCard;
    "pv-energy-donut-card-editor": LovelaceCardEditor;
  }
}
