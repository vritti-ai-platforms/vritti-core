import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { type LabelAnchor, type LabelRow, type PlacedLevel, withUnit } from './stockLevelLayout';

interface LevelLabelsProps {
  levels: PlacedLevel[];
  row: LabelRow;
  uomSymbol: string;
  // Reports each label's rendered width, so the next layout knows whether it fits below the bar
  measure: (node: HTMLElement | null) => void;
}

const ANCHOR_CLASS: Record<LabelAnchor, string> = {
  start: 'translate-x-0',
  center: '-translate-x-1/2',
  end: '-translate-x-full',
};

// The level labels placed on one side of the bar, each hung from its mark; nothing when none is placed there
export const LevelLabels: React.FC<LevelLabelsProps> = ({ levels, row, uomSymbol, measure }) => {
  const fmt = useFormatters();
  const inRow = levels.filter((level) => level.row === row);
  if (inRow.length === 0) return null;

  return (
    <div className="relative h-4">
      {inRow.map((level) => (
        <span
          key={level.name}
          ref={measure}
          data-measure={level.name}
          className={cn('absolute top-0 whitespace-nowrap', ANCHOR_CLASS[level.anchor])}
          style={{ left: `${level.at}%` }}
        >
          <Typography variant="caption" intent="muted" className="leading-4">
            {level.name}{' '}
            <span className="font-medium text-foreground/80 tabular-nums">
              {withUnit(fmt, level.quantity, uomSymbol)}
            </span>
          </Typography>
        </span>
      ))}
    </div>
  );
};
