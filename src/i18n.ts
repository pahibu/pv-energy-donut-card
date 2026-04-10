export type SupportedLanguage = "de" | "en";

export interface UiTranslations {
  addChartsError: string;
  addSegment: string;
  batteryCharge: string;
  batteryDischarge: string;
  cardEditorSection: string;
  cardConfigInvalid: string;
  cardConfigUnavailable: string;
  chartField: string;
  cardTitleField: string;
  cardTitleDefault: string;
  chartsField: string;
  colorField: string;
  consumption: string;
  dailyEntityField: string;
  dailyEntityPlaceholder: string;
  day: string;
  entityField: string;
  feedIn: string;
  gridImport: string;
  keyField: string;
  labelField: string;
  largeSpacing: string;
  mediumSpacing: string;
  modeField: string;
  month: string;
  noNumericEnergyData: string;
  noSpacing: string;
  periodUnitAriaLabel: string;
  previousPeriodAriaLabel: string;
  production: string;
  pvSelfConsumption: string;
  nextPeriodAriaLabel: string;
  remove: string;
  segmentField: string;
  segmentSpacingField: string;
  simpleMode: string;
  timeNavigatorMode: string;
  titleField: string;
  unitField: string;
  year: string;
}

const translations: Record<SupportedLanguage, UiTranslations> = {
  de: {
    addChartsError: "Füge ein oder zwei Diagramme mit mindestens einem Segment hinzu.",
    addSegment: "Segment hinzufügen",
    batteryCharge: "Batterieladung",
    batteryDischarge: "Batterieentladung",
    cardEditorSection: "Karte",
    cardConfigInvalid: "Die Kartenkonfiguration fehlt oder ist ungültig.",
    cardConfigUnavailable: "Die Kartenkonfiguration ist nicht verfügbar.",
    chartField: "Diagramm",
    cardTitleField: "Kartentitel",
    cardTitleDefault: "PV-Energieübersicht",
    chartsField: "Diagramme",
    colorField: "Farbe",
    consumption: "Verbrauch",
    dailyEntityField: "Tages-Entity",
    dailyEntityPlaceholder: "Optional für den Zeitnavigator, bevorzugt für simple",
    day: "Tag",
    entityField: "Entity",
    feedIn: "Einspeisung",
    gridImport: "Netzbezug",
    keyField: "Schlüssel",
    labelField: "Beschriftung",
    largeSpacing: "Groß",
    mediumSpacing: "Mittel",
    modeField: "Modus",
    month: "Monat",
    noNumericEnergyData: "Keine numerischen Energiedaten verfügbar",
    noSpacing: "Kein Abstand",
    nextPeriodAriaLabel: "Nächster Zeitraum",
    periodUnitAriaLabel: "Zeiteinheit",
    previousPeriodAriaLabel: "Vorheriger Zeitraum",
    production: "Produktion",
    pvSelfConsumption: "PV-Eigenverbrauch",
    remove: "Entfernen",
    segmentField: "Segment",
    segmentSpacingField: "Segmentabstand",
    simpleMode: "Einfach",
    timeNavigatorMode: "Zeitnavigator",
    titleField: "Titel",
    unitField: "Einheit",
    year: "Jahr"
  },
  en: {
    addChartsError: "Add one or two charts with at least one segment each.",
    addSegment: "Add Segment",
    batteryCharge: "Battery charge",
    batteryDischarge: "Battery discharge",
    cardEditorSection: "Card",
    cardConfigInvalid: "Card configuration is missing or invalid.",
    cardConfigUnavailable: "Card configuration not available.",
    chartField: "Chart",
    cardTitleField: "Card Title",
    cardTitleDefault: "PV Energy Overview",
    chartsField: "Charts",
    colorField: "Color",
    consumption: "Consumption",
    dailyEntityField: "Daily Entity",
    dailyEntityPlaceholder: "Optional for time navigator, preferred for simple",
    day: "Day",
    entityField: "Entity",
    feedIn: "Feed-in",
    gridImport: "Grid import",
    keyField: "Key",
    labelField: "Label",
    largeSpacing: "Large",
    mediumSpacing: "Medium",
    modeField: "Mode",
    month: "Month",
    noNumericEnergyData: "No numeric energy data available",
    noSpacing: "No spacing",
    nextPeriodAriaLabel: "Next period",
    periodUnitAriaLabel: "Period unit",
    previousPeriodAriaLabel: "Previous period",
    production: "Production",
    pvSelfConsumption: "PV self-consumption",
    remove: "Remove",
    segmentField: "Segment",
    segmentSpacingField: "Segment spacing",
    simpleMode: "Simple",
    timeNavigatorMode: "Time Navigator",
    titleField: "Title",
    unitField: "Unit",
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
