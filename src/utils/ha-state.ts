import { HomeAssistant } from "../types";

const INVALID_STATES = new Set(["unknown", "unavailable", "none", "null", "undefined"]);

export const getNumericEntityState = (
  hass: HomeAssistant | undefined,
  entityId: string
): number => {
  if (!hass) {
    return 0;
  }

  const stateObject = hass.states[entityId];
  const rawState = stateObject?.state?.trim().toLowerCase();
  if (!stateObject || !rawState || INVALID_STATES.has(rawState)) {
    return 0;
  }

  const parsedValue = Number.parseFloat(stateObject.state);
  return Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0;
};
