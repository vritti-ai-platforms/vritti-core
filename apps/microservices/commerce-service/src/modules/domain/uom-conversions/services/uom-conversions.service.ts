import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { type ConversionPair, UomConversionsRepository, type UomRow } from '../repositories/uom-conversions.repository';

const QTY_DP = 3;

@Injectable()
export class UomConversionsService {
  constructor(private readonly repository: UomConversionsRepository) {}

  async toPrimaryQuantity(itemId: string, uomId: string, qty: number): Promise<number> {
    const factor = await this.resolveFactor(itemId, uomId);
    return roundQty(new Decimal(qty).times(factor));
  }

  async toUomQuantity(itemId: string, uomId: string, primaryUomQty: number): Promise<number> {
    const factor = await this.resolveFactor(itemId, uomId);
    return roundQty(new Decimal(primaryUomQty).dividedBy(factor));
  }

  async convertQuantity(itemId: string, fromUomId: string, toUomId: string, qty: number): Promise<number> {
    if (fromUomId === toUomId) return roundQty(new Decimal(qty));
    const [fromFactor, toFactor] = await Promise.all([
      this.resolveFactor(itemId, fromUomId),
      this.resolveFactor(itemId, toUomId),
    ]);
    return roundQty(new Decimal(qty).times(fromFactor).dividedBy(toFactor));
  }

  async isCompatibleUom(itemId: string, uomId: string): Promise<boolean> {
    const itemPrimaryUomId = await this.repository.findItemPrimaryUomId(itemId);
    if (!itemPrimaryUomId) return false;
    if (itemPrimaryUomId === uomId) return true;

    const conversion = await this.repository.findItemConversion(itemId, uomId);
    if (conversion) return true;

    const [itemPrimaryUom, targetUom] = await Promise.all([
      this.repository.findUom(itemPrimaryUomId),
      this.repository.findUom(uomId),
    ]);
    if (!itemPrimaryUom || !targetUom) return false;
    return effectiveBaseId(itemPrimaryUom, itemPrimaryUomId) === effectiveBaseId(targetUom, uomId);
  }

  async toPrimaryQuantities(inputs: { itemId: string; uomId: string; qty: number }[]): Promise<number[]> {
    if (inputs.length === 0) return [];

    const itemIds = Array.from(new Set(inputs.map((i) => i.itemId)));
    const uomIdsFromInputs = new Set(inputs.map((i) => i.uomId));

    const [itemPrimaryUomIds, itemConversions] = await Promise.all([
      this.repository.findItemPrimaryUomIds(itemIds),
      this.repository.findItemConversionsByItemIds(itemIds),
    ]);

    // Union of: input UOM ids + each item's primary UOM id (needed for dimension-base fallback math).
    const uomIdsToFetch = new Set<string>(uomIdsFromInputs);
    for (const itemId of itemIds) {
      const primaryUomId = itemPrimaryUomIds.get(itemId);
      if (primaryUomId) uomIdsToFetch.add(primaryUomId);
    }
    const uomRows = await this.repository.findUoms(Array.from(uomIdsToFetch));

    return inputs.map((input) => {
      const factor = resolveFactorFromMaps(input.itemId, input.uomId, itemPrimaryUomIds, itemConversions, uomRows);
      return roundQty(new Decimal(input.qty).times(factor));
    });
  }

  // Resolves the "primary units per uom unit" factor for an (item, uom) pair.
  // Per-item conversion wins; otherwise we go through the dimension base via the global uom pair.
  private async resolveFactor(itemId: string, uomId: string): Promise<Decimal> {
    const itemPrimaryUomId = await this.repository.findItemPrimaryUomId(itemId);
    if (!itemPrimaryUomId) throw new NotFoundException(`Inventory item ${itemId} not found.`);
    if (itemPrimaryUomId === uomId) return new Decimal(1);

    const conversion = await this.repository.findItemConversion(itemId, uomId);
    if (conversion) return pairToFactor(conversion);

    const [itemPrimaryUom, targetUom] = await Promise.all([
      this.repository.findUom(itemPrimaryUomId),
      this.repository.findUom(uomId),
    ]);
    if (!itemPrimaryUom) throw new NotFoundException(`Item primary UOM ${itemPrimaryUomId} not found.`);
    if (!targetUom) throw new NotFoundException(`UOM ${uomId} not found.`);
    assertSharedBase(itemPrimaryUom, itemPrimaryUomId, targetUom, uomId, itemId);
    return globalPairToItemFactor(targetUom, itemPrimaryUom);
  }
}

function roundQty(value: Decimal): number {
  return value.toDecimalPlaces(QTY_DP, Decimal.ROUND_HALF_UP).toNumber();
}

function pairToFactor(pair: ConversionPair): Decimal {
  return new Decimal(pair.primaryUomQty).dividedBy(pair.uomQty);
}

// factor = (target.baseUomQty × itemPrimary.uomQty) / (target.uomQty × itemPrimary.baseUomQty)
// Reduces to target.baseUomQty/uomQty when item primary is the dimension's base (baseUomQty=uomQty=1).
function globalPairToItemFactor(targetUom: UomRow, itemPrimaryUom: UomRow): Decimal {
  return new Decimal(targetUom.baseUomQty)
    .times(itemPrimaryUom.uomQty)
    .dividedBy(new Decimal(targetUom.uomQty).times(itemPrimaryUom.baseUomQty));
}

function effectiveBaseId(uomRow: UomRow, uomId: string): string {
  return uomRow.baseUnitId ?? uomId;
}

// A global conversion only exists when both UOMs share an effective base unit.
// Two distinct base UOMs (each with baseUnitId=null) in the same dimension have no derivable
// relationship — they require a per-item conversion row.
function assertSharedBase(
  itemPrimaryUom: UomRow,
  itemPrimaryUomId: string,
  targetUom: UomRow,
  targetUomId: string,
  itemId: string,
): void {
  if (effectiveBaseId(itemPrimaryUom, itemPrimaryUomId) !== effectiveBaseId(targetUom, targetUomId)) {
    throw new BadRequestException(
      `No conversion from UOM ${targetUomId} to item ${itemId}'s primary UOM. Add a per-item conversion row to define one.`,
    );
  }
}

function resolveFactorFromMaps(
  itemId: string,
  uomId: string,
  itemPrimaryUomIds: Map<string, string>,
  itemConversions: Map<string, Map<string, ConversionPair>>,
  uomRows: Map<string, UomRow & { id: string }>,
): Decimal {
  const itemPrimaryUomId = itemPrimaryUomIds.get(itemId);
  if (!itemPrimaryUomId) throw new NotFoundException(`Inventory item ${itemId} not found.`);
  if (itemPrimaryUomId === uomId) return new Decimal(1);

  const conversion = itemConversions.get(itemId)?.get(uomId);
  if (conversion) return pairToFactor(conversion);

  const itemPrimaryUom = uomRows.get(itemPrimaryUomId);
  const targetUom = uomRows.get(uomId);
  if (!itemPrimaryUom) throw new NotFoundException(`Item primary UOM ${itemPrimaryUomId} not found.`);
  if (!targetUom) throw new NotFoundException(`UOM ${uomId} not found.`);
  assertSharedBase(itemPrimaryUom, itemPrimaryUomId, targetUom, uomId, itemId);
  return globalPairToItemFactor(targetUom, itemPrimaryUom);
}
