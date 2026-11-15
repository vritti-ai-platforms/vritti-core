import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { min, orderBy, sumBy } from '@vritti/quantum-ui/lodash';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import {
  type SiteStockLocationData,
  type StockStatus,
  StockStatusValues,
  stockStatusConfig,
} from '@/schemas/inventory-items';

interface StockLevelBarProps {
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  maxStockLevel: number;
  // Colours the on-hand bar; left out for a preview of levels not saved yet, which draws it in the neutral colour
  status?: StockStatus;
  uomSymbol: string | null;
  // Splits the on-hand bar into one segment per location holding the stock; left out, the bar is one piece
  locations?: SiteStockLocationData[];
}

// Room past the max level, so stock above it still shows as running into the over-max zone
const SCALE_HEADROOM = 1.1;
// Locations past this many, or too thin to see and hover, fold into one "other locations" segment at the end
const MAX_SEGMENTS = 5;
const MIN_SEGMENT_SHARE = 2;
// How far apart, in % of the bar, two level labels must sit to share a line; a closer one drops to the second line
const MIN_LABEL_GAP = 20;

// Each zone is tinted in the colour of the stock status it gives; the on-hand bar runs over them in the full colour
const ZONE_TINT = {
  [StockStatusValues.BELOW_SAFETY_STOCK]: 'bg-destructive/25',
  [StockStatusValues.REORDER]: 'bg-warning/25',
  [StockStatusValues.HEALTHY]: 'bg-success/25',
  [StockStatusValues.OVER_MAX]: 'bg-group-violet/25',
} as const;

interface Segment {
  key: string;
  path: string;
  quantity: number;
  lotCount: number;
  earliestExpiry: string | null;
}

// A bullet chart of the site's stock against its levels: the track is split into the zones the levels mark out, each
// tinted in the colour of the status it gives, and the on-hand bar runs over them in the status colour, split by the
// locations holding the stock; each level is marked and labelled beneath. With no levels set it is an empty track
export const StockLevelBar: React.FC<StockLevelBarProps> = ({
  onHand,
  safetyStock,
  reorderPoint,
  maxStockLevel,
  status,
  uomSymbol,
  locations,
}) => {
  const fmt = useFormatters();
  const scale = Math.max(maxStockLevel, onHand, 1) * SCALE_HEADROOM;
  const position = (quantity: number) => Math.min((quantity / scale) * 100, 100);
  const withUnit = (quantity: number) => `${fmt.number(quantity).primary}${uomSymbol ? ` ${uomSymbol}` : ''}`;
  const fill = status ? stockStatusConfig[status].fill : 'bg-foreground/70';

  const zones = [
    { status: StockStatusValues.BELOW_SAFETY_STOCK, from: 0, to: safetyStock },
    { status: StockStatusValues.REORDER, from: safetyStock, to: reorderPoint },
    { status: StockStatusValues.HEALTHY, from: reorderPoint, to: maxStockLevel },
    { status: StockStatusValues.OVER_MAX, from: maxStockLevel, to: scale },
  ].filter((zone) => zone.to > zone.from);

  const levels = [
    { name: 'Safety', label: 'Safety stock', quantity: safetyStock },
    { name: 'Reorder', label: 'Reorder point', quantity: reorderPoint },
    { name: 'Max', label: 'Max level', quantity: maxStockLevel },
  ].filter((level) => level.quantity > 0);

  let lastFirstLine = Number.NEGATIVE_INFINITY;
  const labels = levels.map((level) => {
    const at = position(level.quantity);
    const secondLine = at - lastFirstLine < MIN_LABEL_GAP;
    if (!secondLine) lastFirstLine = at;
    return { ...level, at, secondLine, value: withUnit(level.quantity) };
  });
  const usesSecondLine = labels.some((label) => label.secondLine);

  const sorted = orderBy(locations ?? [], 'quantity', 'desc');
  const shown = sorted.filter(
    (location, index) => index < MAX_SEGMENTS && position(location.quantity) >= MIN_SEGMENT_SHARE,
  );
  const folded = sorted.slice(shown.length);
  const segments: Segment[] = [
    ...shown.map((location) => ({
      key: location.locationId,
      path: location.locationPath,
      quantity: location.quantity,
      lotCount: location.lotCount,
      earliestExpiry: location.earliestExpiry,
    })),
    ...(folded.length > 0
      ? [
          {
            key: 'other',
            path: pluralize('other location', folded.length, true),
            quantity: sumBy(folded, 'quantity'),
            lotCount: sumBy(folded, 'lotCount'),
            earliestExpiry: min(folded.map((location) => location.earliestExpiry).filter(Boolean)) ?? null,
          },
        ]
      : []),
  ];

  if (maxStockLevel <= 0) {
    return (
      <div className="flex min-w-64 flex-col gap-1.5">
        <div role="img" aria-label="No stock levels" className="h-3.5 w-full rounded-sm bg-progress-track" />
        <div className="h-4" />
      </div>
    );
  }

  return (
    <div className="flex min-w-64 flex-col gap-1.5">
      <div
        role="img"
        aria-label={`${withUnit(onHand)} on hand${status ? `, ${stockStatusConfig[status].label.toLowerCase()}` : ''}`}
        className="relative h-3.5 w-full"
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-sm">
          {zones.map((zone) => (
            <Tooltip
              key={zone.status}
              content={`${stockStatusConfig[zone.status].label} · ${zone.status === StockStatusValues.OVER_MAX ? `above ${withUnit(zone.from)}` : `${fmt.number(zone.from).primary} – ${withUnit(zone.to)}`}`}
            >
              <span
                className={cn('h-full', ZONE_TINT[zone.status])}
                style={{ width: `${position(zone.to) - position(zone.from)}%` }}
              />
            </Tooltip>
          ))}
        </div>
        {onHand > 0 && (
          <div
            className="absolute inset-y-1 left-0 flex gap-0.5 overflow-hidden rounded-full bg-card motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
            style={{ width: `${position(onHand)}%` }}
          >
            {segments.length > 0 ? (
              segments.map((segment) => (
                <Tooltip
                  key={segment.key}
                  content={
                    <div className="flex min-w-48 flex-col gap-1">
                      <span className="font-medium">{segment.path}</span>
                      <TipRow label="On hand" value={withUnit(segment.quantity)} />
                      <TipRow
                        label="Share of on hand"
                        value={fmt.percent((segment.quantity / onHand) * 100, { maximumFractionDigits: 0 }).primary}
                      />
                      {segment.lotCount > 0 && (
                        <TipRow
                          label={pluralize('Lot', segment.lotCount)}
                          value={`${segment.lotCount} · earliest expiry ${fmt.date(segment.earliestExpiry).primary}`}
                        />
                      )}
                    </div>
                  }
                >
                  <span
                    className={cn('h-full min-w-0.5 basis-0 hover:brightness-110', fill)}
                    style={{ flexGrow: segment.quantity }}
                  />
                </Tooltip>
              ))
            ) : (
              <span className={cn('h-full flex-1', fill)} />
            )}
          </div>
        )}
        {labels.map((level) => (
          <Tooltip
            key={level.name}
            content={
              <div className="flex min-w-44 flex-col gap-1">
                <span className="font-medium">{level.label}</span>
                <TipRow label="Level" value={withUnit(level.quantity)} />
                <TipRow
                  label="On hand"
                  value={
                    onHand === level.quantity
                      ? 'At the level'
                      : `${withUnit(Math.abs(onHand - level.quantity))} ${onHand > level.quantity ? 'above' : 'below'}`
                  }
                />
              </div>
            }
          >
            <span
              className="absolute -top-1 h-5.5 w-px -translate-x-1/2 bg-foreground/70 after:absolute after:-inset-x-2 after:inset-y-0 after:content-[''] hover:w-0.5 hover:bg-foreground"
              style={{ left: `${level.at}%` }}
            />
          </Tooltip>
        ))}
      </div>
      {labels.length > 0 && (
        <div className={cn('relative', usesSecondLine ? 'h-8' : 'h-4')}>
          {labels.map((level) => (
            <span
              key={level.name}
              className={cn(
                'absolute whitespace-nowrap',
                level.secondLine ? 'top-4' : 'top-0',
                level.at < 4 ? 'translate-x-0' : level.at > 96 ? '-translate-x-full' : '-translate-x-1/2',
              )}
              style={{ left: `${level.at}%` }}
            >
              <Typography variant="caption" intent="muted" className="leading-4">
                {level.name} <span className="font-medium text-foreground/80 tabular-nums">{level.value}</span>
              </Typography>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const TipRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="opacity-70">{label}</span>
    <span>{value}</span>
  </div>
);
