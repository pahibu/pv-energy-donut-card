import type { PeriodUnit } from "./period";

export type CardMode = "simple" | "time_navigator";

export interface SegmentSourceOptions {
  mode: CardMode;
  periodUnit: PeriodUnit;
  periodOffset: number;
  entity: string;
  dailyEntity?: string;
}

export const shouldUseDailyEntity = ({
  mode,
  periodUnit,
  periodOffset,
  dailyEntity
}: Omit<SegmentSourceOptions, "entity">): boolean => {
  if (!dailyEntity) {
    return false;
  }

  if (mode === "simple") {
    return true;
  }

  return periodUnit === "day" && periodOffset === 0;
};

export const getSegmentSourceEntity = (options: SegmentSourceOptions): string =>
  shouldUseDailyEntity(options) ? options.dailyEntity ?? options.entity : options.entity;
