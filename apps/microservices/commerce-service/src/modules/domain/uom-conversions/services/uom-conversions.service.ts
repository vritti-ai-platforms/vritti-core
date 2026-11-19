import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { DisplayUnitRatios } from '@/db/schema';
import { DisplayUomQuantityDto } from '../dto/entity/display-uom-quantity.dto';
import type { UnitRatioDto } from '../dto/entity/unit-ratio.dto';
import { UomFactorLookup } from '../dto/entity/uom-factor-lookup.dto';
import {
  type ConversionPair,
  UomConversionsDomainRepository,
  type UomRow,
} from '../repositories/uom-conversions.repository';

const QTY_DP = 3;

type UnitRatio = Pick<UomRow, 'baseUomQty' | 'uomQty'>;

@Injectable()
export class UomConversionsDomainService {
  constructor(private readonly repository: UomConversionsDomainRepository) {}

  async toPrimaryUomQuantity(inventoryItemId: string, uomId: string, qty: number): Promise<number> {
    const factor = await this.resolveFactor(inventoryItemId, uomId);
    return roundQty(new Decimal(qty).times(factor));
  }

  // Expresses a primary-unit quantity in the item's display unit, exactly and as whole display units plus the primary
  // units left over; a negative quantity splits toward zero
  toDisplayUomQuantity(primaryUomQty: number, ratios: DisplayUnitRatios): DisplayUomQuantityDto {
    const factor = ratios.conversion
      ? pairToFactor(ratios.conversion)
      : globalPairToInventoryItemFactor(ratios.displayUom, ratios.primaryUom);
    const exact = new Decimal(primaryUomQty).dividedBy(factor);
    const whole = exact.trunc();
    return {
      primaryUomQty,
      displayUomQty: roundQty(exact),
      wholeDisplayUomQty: whole.toNumber(),
      remainderPrimaryUomQty: roundQty(new Decimal(primaryUomQty).minus(whole.times(factor))),
      displayUomSymbol: ratios.displayUom.symbol,
      primaryUomSymbol: ratios.primaryUom.symbol,
      isPack: ratios.conversion !== null,
    };
  }

  // Expresses each named primary-unit quantity of one item in its display unit, keyed as given; a missing quantity
  // stays null
  toDisplayUomQuantities<K extends string>(
    quantities: Record<K, number | null>,
    ratios: DisplayUnitRatios,
  ): Record<K, DisplayUomQuantityDto | null> {
    return _.mapValues(quantities, (qty) => (qty === null ? null : this.toDisplayUomQuantity(qty, ratios))) as Record<
      K,
      DisplayUomQuantityDto | null
    >;
  }

  // Returns each of the item's units with its exact ratio to the primary unit as whole numbers: 1 = 1 for the primary
  // unit, the item's own conversion where it has one, else the ratio through the units' family base unit
  async findUnitRatios(inventoryItemId: string, primaryUomId: string, uomIds: string[]): Promise<UnitRatioDto[]> {
    const [conversions, uomRows] = await Promise.all([
      this.repository.findInventoryItemConversions([inventoryItemId]),
      this.repository.findUoms([...new Set([...uomIds, primaryUomId])]),
    ]);
    const conversionByUom = new Map(conversions.map((conversion) => [conversion.uomId, conversion]));
    const primaryUom = uomRows.get(primaryUomId);
    if (!primaryUom) throw new NotFoundException(`Inventory item primary UOM ${primaryUomId} not found.`);
    return uomIds.flatMap((uomId) => {
      const unit = uomRows.get(uomId);
      if (!unit) return [];
      return [
        {
          uomId,
          name: unit.name,
          symbol: unit.symbol,
          ...unitRatio(uomId, primaryUomId, conversionByUom, unit, primaryUom),
        },
      ];
    });
  }

  // Resolves the "primary units per uom unit" factor of many (inventory item, uom) pairs in three reads; a pair with
  // no per-item or global conversion is left out of the lookup
  async resolveFactors(pairs: { inventoryItemId: string; uomId: string }[]): Promise<UomFactorLookup> {
    const inventoryItemIds = [...new Set(pairs.map((pair) => pair.inventoryItemId))];
    const [primaryUomIds, conversionRows] = await Promise.all([
      this.repository.findInventoryItemPrimaryUomIds(inventoryItemIds),
      this.repository.findInventoryItemConversions(inventoryItemIds),
    ]);
    const uomRows = await this.repository.findUoms([
      ...new Set([...pairs.map((pair) => pair.uomId), ...primaryUomIds.values()]),
    ]);

    const conversions = new Map<string, Map<string, ConversionPair>>();
    for (const row of conversionRows) {
      const byUom = conversions.get(row.inventoryItemId) ?? new Map<string, ConversionPair>();
      byUom.set(row.uomId, row);
      conversions.set(row.inventoryItemId, byUom);
    }

    const factors = new Map<string, Decimal>();
    for (const { inventoryItemId, uomId } of pairs) {
      const factor = factorFromMaps(inventoryItemId, uomId, primaryUomIds, conversions, uomRows);
      if (factor) factors.set(UomFactorLookup.key(inventoryItemId, uomId), factor);
    }
    return new UomFactorLookup(factors);
  }

  // Resolves the "primary units per uom unit" factor for an (inventory item, uom) pair.
  private async resolveFactor(inventoryItemId: string, uomId: string): Promise<Decimal> {
    const inventoryItem = await this.repository.findInventoryItem(inventoryItemId);
    if (!inventoryItem) throw new NotFoundException(`Inventory item ${inventoryItemId} not found.`);
    const inventoryItemPrimaryUomId = inventoryItem.primaryUomId;
    if (inventoryItemPrimaryUomId === uomId) return new Decimal(1);

    const conversion = await this.repository.findInventoryItemConversion(inventoryItemId, uomId);
    if (conversion) return pairToFactor(conversion);

    const [inventoryItemPrimaryUom, targetUom] = await Promise.all([
      this.repository.findUom(inventoryItemPrimaryUomId),
      this.repository.findUom(uomId),
    ]);
    if (!inventoryItemPrimaryUom) {
      throw new NotFoundException(`Inventory item primary UOM ${inventoryItemPrimaryUomId} not found.`);
    }
    if (!targetUom) throw new NotFoundException(`UOM ${uomId} not found.`);
    assertSharedBase(inventoryItemPrimaryUom, inventoryItemPrimaryUomId, targetUom, uomId, inventoryItem.name);
    return globalPairToInventoryItemFactor(targetUom, inventoryItemPrimaryUom);
  }
}

// A unit's ratio to the item's primary unit as whole numbers: `primaryUomQty` primary units = `uomQty` of the unit
function unitRatio(
  uomId: string,
  primaryUomId: string,
  conversionByUom: Map<string, ConversionPair>,
  unit: UnitRatio,
  primaryUom: UnitRatio,
): ConversionPair {
  if (uomId === primaryUomId) return { primaryUomQty: 1, uomQty: 1 };
  const conversion = conversionByUom.get(uomId);
  if (conversion) return { primaryUomQty: conversion.primaryUomQty, uomQty: conversion.uomQty };
  return {
    primaryUomQty: new Decimal(unit.baseUomQty).times(primaryUom.uomQty).toNumber(),
    uomQty: new Decimal(unit.uomQty).times(primaryUom.baseUomQty).toNumber(),
  };
}

function roundQty(value: Decimal): number {
  return value.toDecimalPlaces(QTY_DP, Decimal.ROUND_HALF_UP).toNumber();
}

function pairToFactor(pair: ConversionPair): Decimal {
  return new Decimal(pair.primaryUomQty).dividedBy(pair.uomQty);
}

// factor = (target.baseUomQty × inventoryItemPrimary.uomQty) / (target.uomQty × inventoryItemPrimary.baseUomQty)
// Reduces to target.baseUomQty/uomQty when inventory item primary is the dimension's base (baseUomQty=uomQty=1).
function globalPairToInventoryItemFactor(targetUom: UnitRatio, inventoryItemPrimaryUom: UnitRatio): Decimal {
  return new Decimal(targetUom.baseUomQty)
    .times(inventoryItemPrimaryUom.uomQty)
    .dividedBy(new Decimal(targetUom.uomQty).times(inventoryItemPrimaryUom.baseUomQty));
}

function effectiveBaseId(uomRow: UomRow, uomId: string): string {
  return uomRow.baseUnitId ?? uomId;
}

// A global conversion only exists when both UOMs share an effective base unit.
function formatUom(uomRow: UomRow): string {
  return uomRow.symbol ? `${uomRow.name} (${uomRow.symbol})` : uomRow.name;
}

function assertSharedBase(
  inventoryItemPrimaryUom: UomRow,
  inventoryItemPrimaryUomId: string,
  targetUom: UomRow,
  targetUomId: string,
  inventoryItemLabel: string,
): void {
  if (effectiveBaseId(inventoryItemPrimaryUom, inventoryItemPrimaryUomId) !== effectiveBaseId(targetUom, targetUomId)) {
    throw new BadRequestException(
      `No UOM conversion from ${formatUom(targetUom)} to ${formatUom(inventoryItemPrimaryUom)} for "${inventoryItemLabel}". Add one to continue.`,
    );
  }
}

// Resolves a factor from pre-loaded maps without throwing: primary → 1, per-item conversion, else the global family
function factorFromMaps(
  inventoryItemId: string,
  uomId: string,
  inventoryItemPrimaryUomIds: Map<string, string>,
  inventoryItemConversions: Map<string, Map<string, ConversionPair>>,
  uomRows: Map<string, UomRow>,
): Decimal | undefined {
  const inventoryItemPrimaryUomId = inventoryItemPrimaryUomIds.get(inventoryItemId);
  if (!inventoryItemPrimaryUomId) return undefined;
  if (inventoryItemPrimaryUomId === uomId) return new Decimal(1);

  const conversion = inventoryItemConversions.get(inventoryItemId)?.get(uomId);
  if (conversion) return pairToFactor(conversion);

  const inventoryItemPrimaryUom = uomRows.get(inventoryItemPrimaryUomId);
  const targetUom = uomRows.get(uomId);
  if (!inventoryItemPrimaryUom || !targetUom) return undefined;
  if (effectiveBaseId(inventoryItemPrimaryUom, inventoryItemPrimaryUomId) !== effectiveBaseId(targetUom, uomId)) {
    return undefined;
  }
  return globalPairToInventoryItemFactor(targetUom, inventoryItemPrimaryUom);
}
