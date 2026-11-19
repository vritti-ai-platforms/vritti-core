import { useFormatters } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import {
  type SiteStockDisplay,
  type SiteStockLocationData,
  type StockStatus,
  stockStatusConfig,
} from '@/schemas/inventory-items';
import { type ReplenishmentMethod, ReplenishmentMethodValues } from '@/schemas/site-items';
import { LevelLabels } from './LevelLabels';
import { LevelMarks } from './LevelMarks';
import { OnHandBar } from './OnHandBar';
import { StockZones } from './StockZones';
import { barPosition, placeLevels, quantityLabels, stockZones } from './stockLevelLayout';
import { useElementWidths } from './useElementWidths';

interface StockLevelBarProps {
  onHand: number;
  // Null while the site does not carry the item, which draws the empty track; manual replenishment draws the stock on
  // hand alone
  replenishment: ReplenishmentMethod | null;
  // Null while not set; a maximum stock left null draws the empty track
  safetyStock: number | null;
  reorderPoint: number | null;
  maxStock: number | null;
  // Colours the on-hand bar; left out for a preview of levels not saved yet, which draws it in the neutral colour
  status?: StockStatus;
  uomSymbol: string;
  // Splits the on-hand bar into one segment per location holding the stock; left out, the bar is one piece
  locations?: SiteStockLocationData[];
  // The stock on hand and levels in the item's display unit, as the server sent them; left out for levels being typed,
  // which are labelled in the primary unit
  display?: SiteStockDisplay;
}

// A bullet chart of the site's stock against its levels: the zones the levels mark out, the stock on hand run over
// them, and a mark and label per level; with manual replenishment only the stock on hand, and an empty track while the
// site does not carry the item or no maximum stock is set
export const StockLevelBar: React.FC<StockLevelBarProps> = ({
  onHand,
  replenishment,
  safetyStock,
  reorderPoint,
  maxStock,
  status,
  uomSymbol,
  locations,
  display,
}) => {
  const fmt = useFormatters();
  const { widths, measure } = useElementWidths();

  const stockLevels = { safetyStock: safetyStock ?? 0, reorderPoint: reorderPoint ?? 0, maxStock: maxStock ?? 0 };
  const labels = quantityLabels(fmt, { ...stockLevels, onHand }, uomSymbol, display);
  const summary = `${labels.onHand.primary} on hand${status ? `, ${stockStatusConfig[status].label.toLowerCase()}` : ''}`;

  if (replenishment === ReplenishmentMethodValues.MANUAL) {
    return (
      <div className="flex min-w-64 flex-col gap-1.5">
        <div role="img" aria-label={summary} className="relative h-3.5 w-full rounded-sm bg-progress-track">
          {onHand > 0 && (
            <OnHandBar
              onHand={onHand}
              position={barPosition(0, onHand)}
              status={status}
              uomSymbol={uomSymbol}
              locations={locations}
            />
          )}
        </div>
        <div className="h-4" />
      </div>
    );
  }

  if (replenishment === null || maxStock === null) {
    return (
      <div className="flex min-w-64 flex-col gap-1.5">
        <div role="img" aria-label="No stock levels" className="h-3.5 w-full rounded-sm bg-progress-track" />
        <div className="h-4" />
      </div>
    );
  }

  const position = barPosition(maxStock, onHand);
  const levels = placeLevels(stockLevels, position, widths.bar ?? 0, widths);

  return (
    <div className="flex min-w-64 flex-col gap-1.5">
      <LevelLabels levels={levels} row="above" labels={labels} measure={measure} />
      <div ref={measure} data-measure="bar" role="img" aria-label={summary} className="relative h-3.5 w-full">
        <StockZones zones={stockZones(stockLevels)} position={position} labels={labels} />
        {onHand > 0 && (
          <OnHandBar onHand={onHand} position={position} status={status} uomSymbol={uomSymbol} locations={locations} />
        )}
        <LevelMarks levels={levels} onHand={onHand} uomSymbol={uomSymbol} labels={labels} />
      </div>
      <LevelLabels levels={levels} row="below" labels={labels} measure={measure} />
    </div>
  );
};
