import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
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
}
