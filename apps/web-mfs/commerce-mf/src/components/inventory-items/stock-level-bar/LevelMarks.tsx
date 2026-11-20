import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type React from 'react';
import type { SiteStockDisplay } from '@/schemas/inventory-items';
import { type PlacedLevel, type QuantityLabels, withUnit } from './stockLevelLayout';
import { TipRow } from './TipRow';

interface LevelMarksProps {
  levels: PlacedLevel[];
  onHand: number;
  uomSymbol: string;
  labels: QuantityLabels;
  // How far the stock on hand is from each level in the item's display unit; left out, the gap reads in the primary unit
  display?: SiteStockDisplay;
}

// A tick across the bar at each level; hovering one shows the level, in the primary unit too when it is labelled in
// another, and how far the stock on hand is from it
export const LevelMarks: React.FC<LevelMarksProps> = ({ levels, onHand, uomSymbol, labels, display }) => {
  const fmt = useFormatters();
  return levels.map((level) => {
    const gapInDisplay = display?.[`${level.key}Gap`];
    const gap = gapInDisplay
      ? fmt.quantity(gapInDisplay).primary
      : withUnit(fmt, Math.abs(onHand - level.quantity), uomSymbol);
    const fromLevel =
      onHand === level.quantity ? 'At the level' : `${gap} ${onHand > level.quantity ? 'above' : 'below'}`;
    return (
      <Tooltip
        key={level.name}
        content={
          <div className="flex min-w-44 flex-col gap-1">
            <span className="font-medium">{level.label}</span>
            <TipRow label="Level" value={labels[level.key].primary} />
            {labels[level.key].secondary && <TipRow label="Primary unit" value={labels[level.key].secondary} />}
            <TipRow label="On hand" value={fromLevel} />
          </div>
        }
      >
        <span
          className="absolute -top-1 h-5.5 w-px -translate-x-1/2 bg-foreground/70 after:absolute after:-inset-x-2 after:inset-y-0 after:content-[''] hover:w-0.5 hover:bg-foreground"
          style={{ left: `${level.at}%` }}
        />
      </Tooltip>
    );
  });
};
