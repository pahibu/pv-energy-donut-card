export interface DonutRenderDatum {
  label: string;
  value: number;
  percentage: number;
  color: string;
  formattedValue: string;
}

export interface DonutRenderModel {
  key: string;
  title: string;
  total: number;
  totalFormatted: string;
  unit: string;
  data: DonutRenderDatum[];
  hasData: boolean;
  noDataText: string;
}
