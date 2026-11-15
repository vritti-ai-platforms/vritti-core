import Decimal from '@vritti/quantum-ui/decimal';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export const MeasureValues = {
  WEIGHT: 'WEIGHT',
  VOLUME: 'VOLUME',
  LENGTH: 'LENGTH',
} as const;
export type Measure = (typeof MeasureValues)[keyof typeof MeasureValues];

export const BASE_MEASURE_SYMBOLS: Record<Measure, string> = {
  [MeasureValues.WEIGHT]: 'g',
  [MeasureValues.VOLUME]: 'ml',
  [MeasureValues.LENGTH]: 'mm',
};

export const DISPLAY_MEASURE_UNITS: Record<Measure, { symbol: string; baseUnits: number }> = {
  [MeasureValues.WEIGHT]: { symbol: 'kg', baseUnits: 1000 },
  [MeasureValues.VOLUME]: { symbol: 'L', baseUnits: 1000 },
  [MeasureValues.LENGTH]: { symbol: 'cm', baseUnits: 10 },
};

// Converts a kg / L / cm value to g / ml / mm, keeping a blank value blank
export function toBaseMeasure(value: number | null, measure: Measure): number | null {
  if (value == null) return null;
  return new Decimal(value).times(DISPLAY_MEASURE_UNITS[measure].baseUnits).toDecimalPlaces(3).toNumber();
}

// Converts a g / ml / mm value to kg / L / cm, keeping a blank value blank
export function fromBaseMeasure(value: number | null, measure: Measure): number | null {
  if (value == null) return null;
  return new Decimal(value).div(DISPLAY_MEASURE_UNITS[measure].baseUnits).toNumber();
}

export interface MeasureFigures {
  weight: number | null;
  volume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
}

const optionalMeasure = zodNumericField({ nullable: true, positive: true });

export const measureFiguresSchema = z.object({
  weight: optionalMeasure,
  volume: optionalMeasure,
  length: optionalMeasure,
  width: optionalMeasure,
  height: optionalMeasure,
});

export type MeasureFiguresFormData = z.infer<typeof measureFiguresSchema>;

export const EMPTY_MEASURE_FIGURES: MeasureFigures = {
  weight: null,
  volume: null,
  length: null,
  width: null,
  height: null,
};

// Picks the five figures off a record, so a form can start from it
export function pickMeasureFigures(record: MeasureFigures): MeasureFigures {
  return {
    weight: record.weight,
    volume: record.volume,
    length: record.length,
    width: record.width,
    height: record.height,
  };
}
