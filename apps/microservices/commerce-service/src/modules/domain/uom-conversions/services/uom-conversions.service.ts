import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { type ConversionPair, UomConversionsRepository, type UomRow } from '../repositories/uom-conversions.repository';

const QTY_DP = 3;

@Injectable()
export class UomConversionsService {
  constructor(private readonly repository: UomConversionsRepository) {}

  async toPrimaryUomQuantity(inventoryItemId: string, uomId: string, qty: number): Promise<number> {
    const factor = await this.resolveFactor(inventoryItemId, uomId);
    return roundQty(new Decimal(qty).times(factor));
  }

  async toUomQuantity(inventoryItemId: string, uomId: string, primaryUomQty: number): Promise<number> {
    const factor = await this.resolveFactor(inventoryItemId, uomId);
    return roundQty(new Decimal(primaryUomQty).dividedBy(factor));
  }

  async convertQuantity(inventoryItemId: string, fromUomId: string, toUomId: string, qty: number): Promise<number> {
    if (fromUomId === toUomId) return roundQty(new Decimal(qty));
    const [fromFactor, toFactor] = await Promise.all([
      this.resolveFactor(inventoryItemId, fromUomId),
      this.resolveFactor(inventoryItemId, toUomId),
    ]);
    return roundQty(new Decimal(qty).times(fromFactor).dividedBy(toFactor));
  }

  async isCompatibleUom(inventoryItemId: string, uomId: string): Promise<boolean> {
    const inventoryItemPrimaryUomId = await this.repository.findInventoryItemPrimaryUomId(inventoryItemId);
    if (!inventoryItemPrimaryUomId) return false;
    if (inventoryItemPrimaryUomId === uomId) return true;

    const conversion = await this.repository.findInventoryItemConversion(inventoryItemId, uomId);
    if (conversion) return true;

    const [inventoryItemPrimaryUom, targetUom] = await Promise.all([
      this.repository.findUom(inventoryItemPrimaryUomId),
      this.repository.findUom(uomId),
    ]);
    if (!inventoryItemPrimaryUom || !targetUom) return false;
    return effectiveBaseId(inventoryItemPrimaryUom, inventoryItemPrimaryUomId) === effectiveBaseId(targetUom, uomId);
  }

  async toPrimaryQuantities(inputs: { inventoryItemId: string; uomId: string; qty: number }[]): Promise<number[]> {
    if (inputs.length === 0) return [];

    const inventoryItemIds = Array.from(new Set(inputs.map((i) => i.inventoryItemId)));
    const uomIdsFromInputs = new Set(inputs.map((i) => i.uomId));

    const [inventoryItemPrimaryUomIds, inventoryItemConversions] = await Promise.all([
      this.repository.findInventoryItemPrimaryUomIds(inventoryItemIds),
      this.repository.findInventoryItemConversionsByInventoryItemIds(inventoryItemIds),
    ]);

    // Union of: input UOM ids + each inventory item's primary UOM id (needed for dimension-base fallback math).
    const uomIdsToFetch = new Set<string>(uomIdsFromInputs);
    for (const inventoryItemId of inventoryItemIds) {
      const primaryUomId = inventoryItemPrimaryUomIds.get(inventoryItemId);
      if (primaryUomId) uomIdsToFetch.add(primaryUomId);
    }
    const uomRows = await this.repository.findUoms(Array.from(uomIdsToFetch));

    return inputs.map((input) => {
      const factor = resolveFactorFromMaps(
        input.inventoryItemId,
        input.uomId,
        inventoryItemPrimaryUomIds,
        inventoryItemConversions,
        uomRows,
      );
      return roundQty(new Decimal(input.qty).times(factor));
    });
  }

  // Resolves the "primary units per uom unit" factor for an (inventory item, uom) pair.
  // Per-item conversion wins; otherwise we go through the dimension base via the global uom pair.
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

function roundQty(value: Decimal): number {
  return value.toDecimalPlaces(QTY_DP, Decimal.ROUND_HALF_UP).toNumber();
}

function pairToFactor(pair: ConversionPair): Decimal {
  return new Decimal(pair.primaryUomQty).dividedBy(pair.uomQty);
}

// factor = (target.baseUomQty × inventoryItemPrimary.uomQty) / (target.uomQty × inventoryItemPrimary.baseUomQty)
// Reduces to target.baseUomQty/uomQty when inventory item primary is the dimension's base (baseUomQty=uomQty=1).
function globalPairToInventoryItemFactor(targetUom: UomRow, inventoryItemPrimaryUom: UomRow): Decimal {
  return new Decimal(targetUom.baseUomQty)
    .times(inventoryItemPrimaryUom.uomQty)
    .dividedBy(new Decimal(targetUom.uomQty).times(inventoryItemPrimaryUom.baseUomQty));
}

function effectiveBaseId(uomRow: UomRow, uomId: string): string {
  return uomRow.baseUnitId ?? uomId;
}

// A global conversion only exists when both UOMs share an effective base unit.
// Two distinct base UOMs (each with baseUnitId=null) in the same dimension have no derivable
// relationship — they require a per-inventory-item conversion row.
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

function resolveFactorFromMaps(
  inventoryItemId: string,
  uomId: string,
  inventoryItemPrimaryUomIds: Map<string, string>,
  inventoryItemConversions: Map<string, Map<string, ConversionPair>>,
  uomRows: Map<string, UomRow & { id: string }>,
): Decimal {
  const inventoryItemPrimaryUomId = inventoryItemPrimaryUomIds.get(inventoryItemId);
  if (!inventoryItemPrimaryUomId) throw new NotFoundException(`Inventory item ${inventoryItemId} not found.`);
  if (inventoryItemPrimaryUomId === uomId) return new Decimal(1);

  const conversion = inventoryItemConversions.get(inventoryItemId)?.get(uomId);
  if (conversion) return pairToFactor(conversion);

  const inventoryItemPrimaryUom = uomRows.get(inventoryItemPrimaryUomId);
  const targetUom = uomRows.get(uomId);
  if (!inventoryItemPrimaryUom) {
    throw new NotFoundException(`Inventory item primary UOM ${inventoryItemPrimaryUomId} not found.`);
  }
  if (!targetUom) throw new NotFoundException(`UOM ${uomId} not found.`);
  assertSharedBase(inventoryItemPrimaryUom, inventoryItemPrimaryUomId, targetUom, uomId, inventoryItemId);
  return globalPairToInventoryItemFactor(targetUom, inventoryItemPrimaryUom);
}
