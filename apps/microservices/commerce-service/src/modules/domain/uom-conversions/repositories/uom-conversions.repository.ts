import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, inventoryItemUomConversions, uom } from '@/db/schema';

export interface ConversionPair {
  primaryUomQty: number;
  uomQty: number;
}

export interface UomRow {
  baseUomQty: number;
  uomQty: number;
  dimensionId: string;
  baseUnitId: string | null;
}

@Injectable()
export class UomConversionsRepository extends PrimaryBaseRepository<typeof inventoryItemUomConversions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemUomConversions);
  }

  async findItemPrimaryUomId(itemId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    return row?.uomId ?? null;
  }

  async findItemConversion(itemId: string, uomId: string): Promise<ConversionPair | null> {
    const [row] = await this.db
      .select({
        primaryUomQty: inventoryItemUomConversions.primaryUomQty,
        uomQty: inventoryItemUomConversions.uomQty,
      })
      .from(inventoryItemUomConversions)
      .where(
        and(eq(inventoryItemUomConversions.inventoryItemId, itemId), eq(inventoryItemUomConversions.uomId, uomId)),
      )
      .limit(1);
    return row ?? null;
  }

  async findUom(uomId: string): Promise<UomRow | null> {
    const [row] = await this.db
      .select({
        baseUomQty: uom.baseUomQty,
        uomQty: uom.uomQty,
        dimensionId: uom.dimensionId,
        baseUnitId: uom.baseUnitId,
      })
      .from(uom)
      .where(eq(uom.id, uomId))
      .limit(1);
    return row ?? null;
  }

  async findItemPrimaryUomIds(itemIds: string[]): Promise<Map<string, string>> {
    if (itemIds.length === 0) return new Map();
    const rows = await this.db
      .select({ id: inventoryItems.id, uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(inArray(inventoryItems.id, itemIds));
    return new Map(rows.map((r) => [r.id, r.uomId]));
  }

  async findItemConversionsByItemIds(itemIds: string[]): Promise<Map<string, Map<string, ConversionPair>>> {
    const result = new Map<string, Map<string, ConversionPair>>();
    if (itemIds.length === 0) return result;
    const rows = await this.db
      .select({
        inventoryItemId: inventoryItemUomConversions.inventoryItemId,
        uomId: inventoryItemUomConversions.uomId,
        primaryUomQty: inventoryItemUomConversions.primaryUomQty,
        uomQty: inventoryItemUomConversions.uomQty,
      })
      .from(inventoryItemUomConversions)
      .where(inArray(inventoryItemUomConversions.inventoryItemId, itemIds));
    for (const row of rows) {
      let perItem = result.get(row.inventoryItemId);
      if (!perItem) {
        perItem = new Map();
        result.set(row.inventoryItemId, perItem);
      }
      perItem.set(row.uomId, { primaryUomQty: row.primaryUomQty, uomQty: row.uomQty });
    }
    return result;
  }

  async findUoms(uomIds: string[]): Promise<Map<string, UomRow & { id: string }>> {
    const result = new Map<string, UomRow & { id: string }>();
    if (uomIds.length === 0) return result;
    const rows = await this.db
      .select({
        id: uom.id,
        baseUomQty: uom.baseUomQty,
        uomQty: uom.uomQty,
        dimensionId: uom.dimensionId,
        baseUnitId: uom.baseUnitId,
      })
      .from(uom)
      .where(inArray(uom.id, uomIds));
    for (const row of rows) result.set(row.id, row);
    return result;
  }
}
