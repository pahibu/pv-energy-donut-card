export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const roundTo = (value: number, precision: number): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const calculatePercentages = (values: number[]): number[] => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return values.map(() => 0);
  }

  return values.map((value) => (value / total) * 100);
};
