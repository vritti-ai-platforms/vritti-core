import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { min, orderBy, sumBy } from '@vritti/quantum-ui/lodash';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type React from 'react';
import {
  type SiteStockDisplay,
  type SiteStockLocationData,
  type StockStatus,
  stockStatusConfig,
} from '@/schemas/inventory-items';
import { type BarPosition, withUnit } from './stockLevelLayout';
import { TipRow } from './TipRow';

interface OnHandBarProps {
  onHand: number;
  position: BarPosition;
  status?: StockStatus;
  uomSymbol: string;
  locations?: SiteStockLocationData[];
  // Each location's stock in the item's display unit, as the server sent it; left out, segments read in the primary unit
  locationDisplays?: SiteStockDisplay['locations'];
}

interface Segment {
  key: string;
  path: string;
  quantity: number;
  // The location id whose display figures name the segment: its own, or for the folded segment the first one folded
  displayFrom: string;
  folded: boolean;
  lotCount: number;
  earliestExpiry: string | null;
}

const MAX_SEGMENTS = 5;
const MIN_SEGMENT_SHARE = 2;

// One segment per location holding the stock, largest first, with the many or thin ones folded into the last
function locationSegments(locations: SiteStockLocationData[], position: BarPosition): Segment[] {
  const sorted = orderBy(locations, 'quantity', 'desc');
  const shown = sorted.filter(
    (location, index) => index < MAX_SEGMENTS && position(location.quantity) >= MIN_SEGMENT_SHARE,
  );
  const folded = sorted.slice(shown.length);
  const segments: Segment[] = shown.map((location) => ({
    key: location.locationId,
    path: location.locationPath,
    quantity: location.quantity,
    displayFrom: location.locationId,
    folded: false,
    lotCount: location.lotCount,
    earliestExpiry: location.earliestExpiry,
  }));
  if (folded.length === 0) return segments;
  return [
    ...segments,
    {
      key: 'other',
      path: pluralize('other location', folded.length, true),
      quantity: sumBy(folded, 'quantity'),
      displayFrom: folded[0].locationId,
      folded: true,
      lotCount: sumBy(folded, 'lotCount'),
      earliestExpiry: min(folded.map((location) => location.earliestExpiry).filter(Boolean)) ?? null,
    },
  ];
}

// The stock on hand, run over the zones in its status colour (neutral for an unsaved preview), split by the locations
// holding it; hovering a segment shows its location, share and lots
export const OnHandBar: React.FC<OnHandBarProps> = ({
  onHand,
  position,
  status,
  uomSymbol,
  locations,
  locationDisplays,
}) => {
  const fmt = useFormatters();
  // A segment's stock in the display unit — the folded one's is its first location with every smaller one after it
  const segmentQuantity = (segment: Segment) => {
    const display = locationDisplays?.find((location) => location.locationId === segment.displayFrom);
    if (!display) return withUnit(fmt, segment.quantity, uomSymbol);
    return fmt.quantity(segment.folded ? display.withSmaller : display.quantity).primary;
  };
  const fill = status ? stockStatusConfig[status].fill : 'bg-foreground/70';
  const segments = locationSegments(locations ?? [], position);

  return (
    <div
      className="absolute inset-y-1 left-0 flex gap-0.5 overflow-hidden rounded-full bg-card motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
      style={{ width: `${position(onHand)}%` }}
    >
      {segments.length === 0 && <span className={cn('h-full flex-1', fill)} />}
      {segments.map((segment) => (
        <Tooltip
          key={segment.key}
          content={
            <div className="flex min-w-48 flex-col gap-1">
              <span className="font-medium">{segment.path}</span>
              <TipRow label="On hand" value={segmentQuantity(segment)} />
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
      ))}
    </div>
  );
};
