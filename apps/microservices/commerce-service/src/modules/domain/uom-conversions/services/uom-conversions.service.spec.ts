import 'reflect-metadata';
import type { DisplayUnitRatios } from '@/db/schema';
import type { UomConversionsDomainRepository } from '../repositories/uom-conversions.repository';
import { UomConversionsDomainService } from './uom-conversions.service';

const service = new UomConversionsDomainService({} as UomConversionsDomainRepository);

const tablet = { symbol: 'tab', baseUomQty: 1, uomQty: 1 };
const gram = { symbol: 'g', baseUomQty: 1, uomQty: 1 };

const primary: DisplayUnitRatios = { conversion: null, displayUom: tablet, primaryUom: tablet };

const strip: DisplayUnitRatios = {
  conversion: { primaryUomQty: 10, uomQty: 1 },
  displayUom: { symbol: 'strip', baseUomQty: 1, uomQty: 1 },
  primaryUom: tablet,
};

const kilogram: DisplayUnitRatios = {
  conversion: null,
  displayUom: { symbol: 'kg', baseUomQty: 1000, uomQty: 1 },
  primaryUom: gram,
};

describe('UomConversionsDomainService.toDisplayUomQuantity', () => {
  it('splits tablets into whole strips and the tablets left over', () => {
    expect(service.toDisplayUomQuantity(2344, strip)).toEqual({
      primaryUomQty: 2344,
      displayUomQty: 234.4,
      wholeDisplayUomQty: 234,
      remainderPrimaryUomQty: 4,
      displayUomSymbol: 'strip',
      primaryUomSymbol: 'tab',
      isPack: true,
    });
  });

  it('leaves a quantity unchanged when the item displays in its primary unit', () => {
    expect(service.toDisplayUomQuantity(2344, primary)).toMatchObject({
      displayUomQty: 2344,
      wholeDisplayUomQty: 2344,
      remainderPrimaryUomQty: 0,
    });
  });

  it("converts through the family's base unit when the display unit is a derived one", () => {
    expect(service.toDisplayUomQuantity(12500, kilogram)).toEqual({
      primaryUomQty: 12500,
      displayUomQty: 12.5,
      wholeDisplayUomQty: 12,
      remainderPrimaryUomQty: 500,
      displayUomSymbol: 'kg',
      primaryUomSymbol: 'g',
      isPack: false,
    });
  });

  it('splits a negative quantity toward zero', () => {
    expect(service.toDisplayUomQuantity(-25, strip)).toMatchObject({
      displayUomQty: -2.5,
      wholeDisplayUomQty: -2,
      remainderPrimaryUomQty: -5,
    });
  });

  it('converts every named quantity of an item and leaves a missing one null', () => {
    const display = service.toDisplayUomQuantities({ onHand: 25, maxStock: null }, strip);
    expect(display.onHand?.wholeDisplayUomQty).toBe(2);
    expect(display.maxStock).toBeNull();
  });

  it("prefers the per-item conversion over the units' family ratios", () => {
    const box = { ...kilogram, conversion: { primaryUomQty: 100, uomQty: 1 } };
    expect(service.toDisplayUomQuantity(250, box).wholeDisplayUomQty).toBe(2);
  });
});

describe('UomConversionsDomainService.findUnitRatios', () => {
  const uomRow = (name: string, baseUomQty: number, uomQty: number) => ({
    name,
    symbol: name,
    baseUomQty,
    uomQty,
    dimensionId: 'dim',
    baseUnitId: null,
  });
  const repository = {
    findInventoryItemConversions: jest
      .fn()
      .mockResolvedValue([{ inventoryItemId: 'item', uomId: 'strip', primaryUomQty: 10, uomQty: 1 }]),
    findUoms: jest.fn().mockResolvedValue(
      new Map([
        ['g', uomRow('g', 1, 1)],
        ['kg', uomRow('kg', 1000, 1)],
        ['strip', uomRow('strip', 1, 1)],
      ]),
    ),
  } as unknown as UomConversionsDomainRepository;

  it('gives the primary unit 1 = 1, a conversion its own pair, and a family unit its ratio through the base', async () => {
    const ratios = await new UomConversionsDomainService(repository).findUnitRatios('item', 'g', ['g', 'strip', 'kg']);
    expect(ratios).toEqual([
      { uomId: 'g', name: 'g', symbol: 'g', primaryUomQty: 1, uomQty: 1 },
      { uomId: 'strip', name: 'strip', symbol: 'strip', primaryUomQty: 10, uomQty: 1 },
      { uomId: 'kg', name: 'kg', symbol: 'kg', primaryUomQty: 1000, uomQty: 1 },
    ]);
  });
});
