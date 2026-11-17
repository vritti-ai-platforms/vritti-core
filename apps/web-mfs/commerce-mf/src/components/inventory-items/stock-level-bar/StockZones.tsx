import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import type React from 'react';
import { StockStatusValues, stockStatusConfig } from '@/schemas/inventory-items';
import { type BarPosition, type StockZone, withUnit, type ZoneStatus } from './stockLevelLayout';

interface StockZonesProps {
  zones: StockZone[];
  position: BarPosition;
  uomSymbol: string;
}

const ZONE_TINT: Record<ZoneStatus, string> = {
  [StockStatusValues.BELOW_SAFETY_STOCK]: 'bg-destructive/25',
  [StockStatusValues.REORDER]: 'bg-warning/25',
  [StockStatusValues.HEALTHY]: 'bg-success/25',
  [StockStatusValues.OVER_MAX]: 'bg-group-violet/25',
};

// The bar's track, split into the zones the levels mark out; hovering one names its status and range
export const StockZones: React.FC<StockZonesProps> = ({ zones, position, uomSymbol }) => {
  const fmt = useFormatters();
  return (
    <div className="absolute inset-0 flex overflow-hidden rounded-sm">
      {zones.map((zone) => {
        const range =
          zone.status === StockStatusValues.OVER_MAX
            ? `above ${withUnit(fmt, zone.from, uomSymbol)}`
            : `${fmt.number(zone.from).primary} – ${withUnit(fmt, zone.to, uomSymbol)}`;
        return (
          <Tooltip key={zone.status} content={`${stockStatusConfig[zone.status].label} · ${range}`}>
            <span
              className={cn('h-full', ZONE_TINT[zone.status])}
              style={{ width: `${position(zone.to) - position(zone.from)}%` }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};
