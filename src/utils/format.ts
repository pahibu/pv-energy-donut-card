import { HomeAssistant } from "../types";
import { roundTo } from "./math";

const DEFAULT_LOCALE = "en";

export const getLocale = (hass?: HomeAssistant, configuredLocale?: string): string =>
  configuredLocale ?? hass?.locale?.language ?? DEFAULT_LOCALE;

export const formatNumber = (
  value: number,
  locale: string,
  precision: number
): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(roundTo(value, precision));

export const formatEnergyValue = (
  value: number,
  unit: string,
  locale: string,
  precision: number
): string => `${formatNumber(value, locale, precision)} ${unit}`.trim();

export const formatPercentage = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: value >= 10 ? 0 : 1,
    maximumFractionDigits: value >= 10 ? 0 : 1
  }).format(value);
