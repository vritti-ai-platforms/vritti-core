import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Progress } from '@vritti/quantum-ui/Progress';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import {
  type LocationFillData,
  type LocationFillStatus,
  LocationFillStatusLabels,
  LocationFillStatusValues,
  locationFillStatus,
} from '@/schemas/locations';
import { DISPLAY_MEASURE_UNITS, fromBaseMeasure, type Measure, MeasureValues } from '@/schemas/measures';

const BAR_VARIANT: Record<LocationFillStatus, 'default' | 'warning' | 'destructive'> = {
  [LocationFillStatusValues.OK]: 'default',
  [LocationFillStatusValues.NEARLY_FULL]: 'warning',
  [LocationFillStatusValues.OVER_CAPACITY]: 'destructive',
};

const TEXT_CLASS: Record<LocationFillStatus, string> = {
  [LocationFillStatusValues.OK]: 'text-muted-foreground',
  [LocationFillStatusValues.NEARLY_FULL]: 'text-warning',
  [LocationFillStatusValues.OVER_CAPACITY]: 'text-destructive',
};

interface LocationFillBarProps {
  fill: LocationFillData | null;
  className?: string;
}

// Capacity bar with the percentage and its status in words, coloured once the location is nearly full
export const LocationFillBar: React.FC<LocationFillBarProps> = ({ fill, className }) => {
  const fmt = useFormatters();
  if (!fill) return <span className="text-muted-foreground">—</span>;
  const status = locationFillStatus(fill.capacityPercent);
  const percentText = `${fmt.number(fill.capacityPercent).primary}%`;

  return (
    <div className={cn('flex min-w-40 items-center gap-2', className)}>
      <Progress
        value={Math.min(fill.capacityPercent, 100)}
        variant={BAR_VARIANT[status]}
        className="h-2 flex-1"
        aria-label={`${percentText} full, ${LocationFillStatusLabels[status].toLowerCase()}`}
      />
      <span className={cn('whitespace-nowrap font-mono text-xs', TEXT_CLASS[status])}>
        {percentText}
        {status !== LocationFillStatusValues.OK && ` · ${LocationFillStatusLabels[status]}`}
      </span>
    </div>
  );
};

interface MeasureUsageTextProps {
  used: number;
  max: number | null;
  measure: Measure;
}

// Renders "used / max kg" (or L) from g / ml; just the used amount when the type sets no maximum
export const MeasureUsageText: React.FC<MeasureUsageTextProps> = ({ used, max, measure }) => {
  const fmt = useFormatters();
  const symbol = DISPLAY_MEASURE_UNITS[measure].symbol;
  const usedText = fmt.number(fromBaseMeasure(used, measure)).primary;
  if (max == null) {
    return (
      <span className="font-mono whitespace-nowrap">
        {usedText} {symbol} <span className="text-muted-foreground">(no limit)</span>
      </span>
    );
  }
  return (
    <span className="font-mono whitespace-nowrap">
      {usedText} / {fmt.number(fromBaseMeasure(max, measure)).primary} {symbol}
    </span>
  );
};

interface LocationFillDetailsProps {
  fill: LocationFillData | null;
}

// Capacity bar plus weight and volume used against the type's maxima, and the items missing storage figures
export const LocationFillDetails: React.FC<LocationFillDetailsProps> = ({ fill }) => {
  if (!fill) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <LocationFillBar fill={fill} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>
          <span className="text-muted-foreground">Weight </span>
          <MeasureUsageText used={fill.weightUsed} max={fill.weightMax} measure={MeasureValues.WEIGHT} />
        </span>
        <span>
          <span className="text-muted-foreground">Volume </span>
          <MeasureUsageText used={fill.volumeUsed} max={fill.volumeMax} measure={MeasureValues.VOLUME} />
        </span>
      </div>
      {fill.unconfiguredItemCount > 0 && (
        <span className="text-xs text-warning">
          {pluralize('item', fill.unconfiguredItemCount, true)} without storage figures for this type — not counted
        </span>
      )}
    </div>
  );
};

interface LocationFillPercentProps {
  fill: LocationFillData | null | undefined;
}

// Compact capacity percentage for a tree row, coloured once the location is nearly full
export const LocationFillPercent: React.FC<LocationFillPercentProps> = ({ fill }) => {
  const fmt = useFormatters();
  if (!fill) return null;
  const status = locationFillStatus(fill.capacityPercent);
  return (
    <span
      className={cn('font-mono text-xs', TEXT_CLASS[status])}
      title={`${LocationFillStatusLabels[status]} · ${fmt.number(fill.capacityPercent).primary}% full`}
    >
      {fmt.number(fill.capacityPercent).primary}%
    </span>
  );
};
