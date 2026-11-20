import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';
import { toSiteStockDisplay } from './site-stock-display.dto';

const toDisplay = (primaryUomQty: number): DisplayUomQuantityDto => ({
  primaryUomQty,
  displayUomQty: primaryUomQty / 10,
  wholeDisplayUomQty: Math.trunc(primaryUomQty / 10),
  remainderPrimaryUomQty: primaryUomQty % 10,
  displayUomSymbol: 'strip',
  primaryUomSymbol: 'tab',
  isPack: true,
});

const location = (locationId: string, quantity: number) => ({
  locationId,
  locationName: locationId,
  locationPath: locationId,
  quantity,
  lotCount: 0,
  earliestExpiry: null,
});

describe('toSiteStockDisplay', () => {
  it('expresses the stock, the levels and how far the stock is from each level', () => {
    const display = toSiteStockDisplay({ onHand: 120, safetyStock: 50, reorderPoint: 200, maxStock: null }, toDisplay);
    expect(display.onHand?.primaryUomQty).toBe(120);
    expect(display.safetyStockGap?.primaryUomQty).toBe(70);
    expect(display.reorderPointGap?.primaryUomQty).toBe(80);
    expect(display.maxStock).toBeNull();
    expect(display.maxStockGap).toBeNull();
    expect(display.locations).toEqual([]);
  });

  it('gives each location its stock alone and with the smaller locations after it', () => {
    const display = toSiteStockDisplay(
      {
        onHand: 0.6,
        safetyStock: null,
        reorderPoint: null,
        maxStock: null,
        locations: [location('a', 0.3), location('b', 0.2), location('c', 0.1)],
      },
      toDisplay,
    );
    expect(display.locations.map((entry) => entry.locationId)).toEqual(['a', 'b', 'c']);
    expect(display.locations.map((entry) => entry.quantity.primaryUomQty)).toEqual([0.3, 0.2, 0.1]);
    expect(display.locations.map((entry) => entry.withSmaller.primaryUomQty)).toEqual([0.6, 0.3, 0.1]);
  });
});
