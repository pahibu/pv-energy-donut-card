export type PeriodUnit = "day" | "month" | "year";

export interface PeriodRange {
  start: Date;
  end: Date;
  key: string;
}

export const getPeriodRange = (
  unit: PeriodUnit,
  offset: number,
  now: Date,
  trackedEntities: string[]
): PeriodRange => {
  let start: Date;
  let end: Date;

  if (unit === "year") {
    start = new Date(now.getFullYear() - offset, 0, 1, 0, 0, 0, 0);
    end = new Date(start.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  } else if (unit === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - offset, 1, 0, 0, 0, 0);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 0, 0, 0, 0);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0);
  }

  return {
    start,
    end,
    key: `${unit}:${offset}:${trackedEntities.join(",")}`
  };
};

export const isCurrentOpenPeriod = (offset: number): boolean => offset === 0;
