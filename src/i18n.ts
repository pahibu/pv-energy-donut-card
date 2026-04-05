export type SupportedLanguage = "de" | "en";

export interface UiTranslations {
  addChartsError: string;
  batteryCharge: string;
  batteryDischarge: string;
  cardConfigInvalid: string;
  cardConfigUnavailable: string;
  cardTitleDefault: string;
  consumption: string;
  day: string;
  feedIn: string;
  gridImport: string;
  month: string;
  noNumericEnergyData: string;
  periodUnitAriaLabel: string;
  previousPeriodAriaLabel: string;
  production: string;
  pvSelfConsumption: string;
  year: string;
  nextPeriodAriaLabel: string;
}

const translations: Record<SupportedLanguage, UiTranslations> = {
  de: {
    addChartsError: "Füge ein oder zwei Diagramme mit mindestens einem Segment hinzu.",
    batteryCharge: "Batterieladung",
    batteryDischarge: "Batterieentladung",
    cardConfigInvalid: "Die Kartenkonfiguration fehlt oder ist ungültig.",
    cardConfigUnavailable: "Die Kartenkonfiguration ist nicht verfügbar.",
    cardTitleDefault: "PV-Energieübersicht",
    consumption: "Verbrauch",
    day: "Tag",
    feedIn: "Einspeisung",
    gridImport: "Netzbezug",
    month: "Monat",
    noNumericEnergyData: "Keine numerischen Energiedaten verfügbar",
    nextPeriodAriaLabel: "Nächster Zeitraum",
    periodUnitAriaLabel: "Zeiteinheit",
    previousPeriodAriaLabel: "Vorheriger Zeitraum",
    production: "Produktion",
    pvSelfConsumption: "PV-Eigenverbrauch",
    year: "Jahr"
  },
  en: {
    addChartsError: "Add one or two charts with at least one segment each.",
    batteryCharge: "Battery charge",
    batteryDischarge: "Battery discharge",
    cardConfigInvalid: "Card configuration is missing or invalid.",
    cardConfigUnavailable: "Card configuration not available.",
    cardTitleDefault: "PV Energy Overview",
    consumption: "Consumption",
    day: "Day",
    feedIn: "Feed-in",
    gridImport: "Grid import",
    month: "Month",
    noNumericEnergyData: "No numeric energy data available",
    nextPeriodAriaLabel: "Next period",
    periodUnitAriaLabel: "Period unit",
    previousPeriodAriaLabel: "Previous period",
    production: "Production",
    pvSelfConsumption: "PV self-consumption",
    year: "Year"
  }
};

export const getLanguageFromLocale = (locale?: string): SupportedLanguage =>
  locale?.toLowerCase().startsWith("de") ? "de" : "en";

export const getTranslations = (locale?: string): UiTranslations => translations[getLanguageFromLocale(locale)];

export const formatHistoryRequestFailed = (status: number, locale?: string): string => {
  const language = getLanguageFromLocale(locale);
  return language === "de"
    ? `Verlaufsanfrage fehlgeschlagen (${status})`
    : `History request failed (${status})`;
};
