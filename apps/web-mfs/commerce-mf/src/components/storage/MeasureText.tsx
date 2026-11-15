import { useFormatters } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import {
  BASE_MEASURE_SYMBOLS,
  DISPLAY_MEASURE_UNITS,
  fromBaseMeasure,
  type Measure,
  MeasureValues,
} from '@/schemas/measures';

interface MeasureTextProps {
  value: number | null;
  measure: Measure;
  inBaseUnits?: boolean;
}

// Renders a g / ml / mm value in kg / L / cm, or as stored when `inBaseUnits`; blank renders as a dash
export const MeasureText: React.FC<MeasureTextProps> = ({ value, measure, inBaseUnits = false }) => {
  const fmt = useFormatters();
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const shown = inBaseUnits ? value : fromBaseMeasure(value, measure);
  const symbol = inBaseUnits ? BASE_MEASURE_SYMBOLS[measure] : DISPLAY_MEASURE_UNITS[measure].symbol;
  return (
    <span className="font-mono whitespace-nowrap">
      {fmt.number(shown).primary} {symbol}
    </span>
  );
};

interface DimensionsTextProps {
  length: number | null;
  width: number | null;
  height: number | null;
  inBaseUnits?: boolean;
}

// Renders L × W × H from mm, in cm or as stored when `inBaseUnits`; all three blank renders as a dash
export const DimensionsText: React.FC<DimensionsTextProps> = ({ length, width, height, inBaseUnits = false }) => {
  const fmt = useFormatters();
  if (length == null && width == null && height == null) return <span className="text-muted-foreground">—</span>;
  const measure = MeasureValues.LENGTH;
  const symbol = inBaseUnits ? BASE_MEASURE_SYMBOLS[measure] : DISPLAY_MEASURE_UNITS[measure].symbol;
  const side = (value: number | null) =>
    value == null ? '—' : fmt.number(inBaseUnits ? value : fromBaseMeasure(value, measure)).primary;
  return (
    <span className="font-mono whitespace-nowrap">
      {side(length)} × {side(width)} × {side(height)} {symbol}
    </span>
  );
};
