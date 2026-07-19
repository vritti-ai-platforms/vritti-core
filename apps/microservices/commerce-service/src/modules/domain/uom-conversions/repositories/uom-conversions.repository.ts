import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, inArray } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, inventoryItemUomConversions, uom } from '@/db/schema';

export interface ConversionPair {
  primaryUomQty: number;
  uomQty: number;
}

export interface UomRow {
  name: string;
  symbol: string;
  baseUomQty: number;
  uomQty: number;
  dimensionId: string;
  baseUnitId: string | null;
}

@Injectable()
export class UomConversionsDomainRepository extends PrimaryBaseRepository<typeof inventoryItemUomConversions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemUomConversions);
  }

  async findInventoryItemPrimaryUomId(inventoryItemId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1);
    return row?.uomId ?? null;
  }

  async findInventoryItemConversion(inventoryItemId: string, uomId: string): Promise<ConversionPair | null> {
    const [row] = await this.db
      .select({
        primaryUomQty: inventoryItemUomConversions.primaryUomQty,
        uomQty: inventoryItemUomConversions.uomQty,
      })
      .from(inventoryItemUomConversions)
      .where(
        and(
          eq(inventoryItemUomConversions.inventoryItemId, inventoryItemId),
          eq(inventoryItemUomConversions.uomId, uomId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findUom(uomId: string): Promise<UomRow | null> {
    const [row] = await this.db
      .select({
        name: uom.name,
        symbol: uom.symbol,
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

  // Primary UOM id + name in one read — used by resolveFactor so it doesn't re-query the item just
  // to label an error.
  async findInventoryItem(inventoryItemId: string): Promise<{ primaryUomId: string; name: string } | null> {
    const [row] = await this.db
      .select({ primaryUomId: inventoryItems.uomId, name: inventoryItems.name })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1);
    return row ?? null;
  }

  async findInventoryItemPrimaryUomIds(inventoryItemIds: string[]): Promise<Map<string, string>> {
    if (inventoryItemIds.length === 0) return new Map();
    const rows = await this.db
      .select({ id: inventoryItems.id, uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(inArray(inventoryItems.id, inventoryItemIds));
    return new Map(rows.map((r) => [r.id, r.uomId]));
  }

  async findInventoryItemConversionsByInventoryItemIds(
    inventoryItemIds: string[],
  ): Promise<Map<string, Map<string, ConversionPair>>> {
    const result = new Map<string, Map<string, ConversionPair>>();
    if (inventoryItemIds.length === 0) return result;
    const rows = await this.db
      .select({
        inventoryItemId: inventoryItemUomConversions.inventoryItemId,
        uomId: inventoryItemUomConversions.uomId,
        primaryUomQty: inventoryItemUomConversions.primaryUomQty,
        uomQty: inventoryItemUomConversions.uomQty,
      })
      .from(inventoryItemUomConversions)
      .where(inArray(inventoryItemUomConversions.inventoryItemId, inventoryItemIds));
    for (const row of rows) {
      let perInventoryItem = result.get(row.inventoryItemId);
      if (!perInventoryItem) {
        perInventoryItem = new Map();
        result.set(row.inventoryItemId, perInventoryItem);
      }
      perInventoryItem.set(row.uomId, { primaryUomQty: row.primaryUomQty, uomQty: row.uomQty });
    }
    return result;
  }

  async findUoms(uomIds: string[]): Promise<Map<string, UomRow & { id: string }>> {
    const result = new Map<string, UomRow & { id: string }>();
    if (uomIds.length === 0) return result;
    const rows = await this.db
      .select({
        id: uom.id,
        name: uom.name,
        symbol: uom.symbol,
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
