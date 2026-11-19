import type { Formatters } from '@vritti/quantum-ui/hooks';
import { type SiteStockDisplay, type StockStatus, StockStatusValues } from '@/schemas/inventory-items';

const SCALE_HEADROOM = 1.1;
const LABEL_GAP_PX = 8;

export type LabelAnchor = 'start' | 'center' | 'end';
export type LabelRow = 'above' | 'below';

export interface StockLevels {
  safetyStock: number;
  reorderPoint: number;
  maxStock: number;
}

export type LevelKey = keyof StockLevels;

export type QuantityLabels = Record<LevelKey | 'onHand', ReturnType<Formatters['quantity']>>;

export type ZoneStatus = Exclude<
  StockStatus,
  typeof StockStatusValues.OUT_OF_STOCK | typeof StockStatusValues.IN_STOCK
>;

export interface StockZone {
  status: ZoneStatus;
  from: number;
  to: number;
  fromLevel?: LevelKey;
  toLevel?: LevelKey;
}

export interface PlacedLevel {
  key: LevelKey;
  name: string;
  label: string;
  quantity: number;
  at: number;
  anchor: LabelAnchor;
  row: LabelRow;
}

export type BarPosition = (quantity: number) => number;

const ANCHOR_SHARE: Record<LabelAnchor, number> = { start: 0, center: 0.5, end: 1 };

// A quantity with the item's unit
export function withUnit(fmt: Formatters, quantity: number, uomSymbol: string): string {
  return `${fmt.number(quantity).primary} ${uomSymbol}`;
}

// The label of the stock on hand and each level: in the item's display unit from the server's display values, else — for
// levels still being typed — in its primary unit
export function quantityLabels(
  fmt: Formatters,
  quantities: StockLevels & { onHand: number },
  uomSymbol: string,
  display?: SiteStockDisplay,
): QuantityLabels {
  const label = (key: keyof QuantityLabels) =>
    display ? fmt.quantity(display[key]) : { primary: withUnit(fmt, quantities[key], uomSymbol) };
  return {
    onHand: label('onHand'),
    safetyStock: label('safetyStock'),
    reorderPoint: label('reorderPoint'),
    maxStock: label('maxStock'),
  };
}

// The bar's scale: it runs a little past the maximum stock, or past the stock on hand when that is higher
export function barPosition(maxStock: number, onHand: number): BarPosition {
  const scale = Math.max(maxStock, onHand, 1) * SCALE_HEADROOM;
  return (quantity) => Math.min((quantity / scale) * 100, 100);
}

// The zones the levels mark out along the bar, each named by the stock status it gives; empty zones are left out
export function stockZones({ safetyStock, reorderPoint, maxStock }: StockLevels): StockZone[] {
  const zones: StockZone[] = [
    { status: StockStatusValues.BELOW_SAFETY_STOCK, from: 0, to: safetyStock, toLevel: 'safetyStock' },
    {
      status: StockStatusValues.REORDER,
      from: safetyStock,
      to: reorderPoint,
      fromLevel: 'safetyStock',
      toLevel: 'reorderPoint',
    },
    {
      status: StockStatusValues.HEALTHY,
      from: reorderPoint,
      to: maxStock,
      fromLevel: 'reorderPoint',
      toLevel: 'maxStock',
    },
    { status: StockStatusValues.OVER_MAX, from: maxStock, to: Number.POSITIVE_INFINITY, fromLevel: 'maxStock' },
  ];
  return zones.filter((zone) => zone.to > zone.from);
}

// Where a label hangs from its mark: from its start near the left end, its end near the right end, else its middle
function anchorAt(at: number): LabelAnchor {
  if (at < 4) return 'start';
  if (at > 96) return 'end';
  return 'center';
}

// The levels that are set, each at its mark and on the row its label fits: below the bar unless it would run into the
// label before it there, then above; label widths are the rendered ones, keyed by level name
export function placeLevels(
  { safetyStock, reorderPoint, maxStock }: StockLevels,
  position: BarPosition,
  barWidth: number,
  labelWidths: Record<string, number>,
): PlacedLevel[] {
  const lastRight: Record<LabelRow, number> = { above: Number.NEGATIVE_INFINITY, below: Number.NEGATIVE_INFINITY };
  const levels: Pick<PlacedLevel, 'key' | 'name' | 'label' | 'quantity'>[] = [
    { key: 'safetyStock', name: 'Safety', label: 'Safety stock', quantity: safetyStock },
    { key: 'reorderPoint', name: 'Reorder', label: 'Reorder point', quantity: reorderPoint },
    { key: 'maxStock', name: 'Max', label: 'Maximum stock', quantity: maxStock },
  ];
  return levels
    .filter((level) => level.quantity > 0)
    .map((level) => {
      const at = position(level.quantity);
      const anchor = anchorAt(at);
      const width = labelWidths[level.name] ?? 0;
      const left = (at / 100) * barWidth - width * ANCHOR_SHARE[anchor];
      const row: LabelRow = left >= lastRight.below + LABEL_GAP_PX ? 'below' : 'above';
      lastRight[row] = left + width;
      return { ...level, at, anchor, row };
    });
}
