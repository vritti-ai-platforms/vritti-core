import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';
import Decimal from '@vritti/api-sdk/decimal';
import type { SiteStockLocation } from '@/db/schema';

export const SITE_STOCK_QUANTITY_KEYS = ['onHand', 'safetyStock', 'reorderPoint', 'maxStock'] as const;

export type SiteStockQuantityKey = (typeof SITE_STOCK_QUANTITY_KEYS)[number];

export class SiteStockLocationDisplayDto {
  locationId: string;
  quantity: DisplayUomQuantityDto;
  // This location's stock with that of every location after it, which holds less: what a bar folds into one segment
  withSmaller: DisplayUomQuantityDto;
}

export class SiteStockDisplayDto {
  onHand: DisplayUomQuantityDto | null;
  safetyStock: DisplayUomQuantityDto | null;
  reorderPoint: DisplayUomQuantityDto | null;
  maxStock: DisplayUomQuantityDto | null;
  // How far the stock on hand is from each level, either way
  safetyStockGap: DisplayUomQuantityDto | null;
  reorderPointGap: DisplayUomQuantityDto | null;
  maxStockGap: DisplayUomQuantityDto | null;
  // The locations in the order given, largest first
  locations: SiteStockLocationDisplayDto[];
}

export type SiteStockDisplaySource = Record<SiteStockQuantityKey, number | null> & { locations?: SiteStockLocation[] };

// An item's stock at a site in its display unit, through the item's conversion: the stock on hand and levels, how far
// the stock is from each level, and each location's stock alone and with the smaller ones after it
export function toSiteStockDisplay(
  stock: SiteStockDisplaySource,
  toDisplay: (primaryUomQty: number) => DisplayUomQuantityDto,
): SiteStockDisplayDto {
  const inDisplay = (qty: number | null) => (qty === null ? null : toDisplay(qty));
  const gap = (level: number | null) =>
    level === null || stock.onHand === null ? null : toDisplay(new Decimal(stock.onHand).minus(level).abs().toNumber());
  const locations = stock.locations ?? [];
  const withSmaller: number[] = [];
  let running = new Decimal(0);
  for (let index = locations.length - 1; index >= 0; index--) {
    running = running.plus(locations[index].quantity);
    withSmaller[index] = running.toNumber();
  }
  return {
    onHand: inDisplay(stock.onHand),
    safetyStock: inDisplay(stock.safetyStock),
    reorderPoint: inDisplay(stock.reorderPoint),
    maxStock: inDisplay(stock.maxStock),
    safetyStockGap: gap(stock.safetyStock),
    reorderPointGap: gap(stock.reorderPoint),
    maxStockGap: gap(stock.maxStock),
    locations: locations.map((location, index) => ({
      locationId: location.locationId,
      quantity: toDisplay(location.quantity),
      withSmaller: toDisplay(withSmaller[index]),
    })),
  };
}
