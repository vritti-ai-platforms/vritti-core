import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemUomConversion,
  inventoryItems,
  inventoryItemUomConversions,
  supplierItems,
  uom,
} from '@/db/schema';

export type ConversionWithUom = InventoryItemUomConversion & {
  uomName: string | null;
  uomSymbol: string | null;
};

function buildJoinedSelect() {
  return {
    id: inventoryItemUomConversions.id,
    organizationId: inventoryItemUomConversions.organizationId,
    inventoryItemId: inventoryItemUomConversions.inventoryItemId,
    uomId: inventoryItemUomConversions.uomId,
    primaryUomQty: inventoryItemUomConversions.primaryUomQty,
    uomQty: inventoryItemUomConversions.uomQty,
    createdAt: inventoryItemUomConversions.createdAt,
    updatedAt: inventoryItemUomConversions.updatedAt,
    uomName: uom.name,
    uomSymbol: uom.symbol,
  };
}

@Injectable()
export class InventoryItemUomConversionsRepository extends PrimaryBaseRepository<typeof inventoryItemUomConversions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemUomConversions);
  }

  // Returns paginated, filtered, sorted UOM overrides for an inventory item with joined UOM details
  async findForTable(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: ConversionWithUom[]; count: number }> {
    const baseWhere = eq(inventoryItemUomConversions.inventoryItemId, inventoryItemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    const { result, count } = await this.findAllAndCount<ConversionWithUom>({
      select: buildJoinedSelect(),
      leftJoins: [{ table: uom, on: eq(inventoryItemUomConversions.uomId, uom.id) }],
      where: combinedWhere,
      orderBy: options.orderBy ?? [asc(inventoryItemUomConversions.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });

    return { result: result as ConversionWithUom[], count };
  }

  // Returns a single UOM conversion by ID with joined UOM details
  async findById(id: string): Promise<ConversionWithUom | undefined> {
    const rows = await this.db
      .select(buildJoinedSelect())
      .from(inventoryItemUomConversions)
      .leftJoin(uom, eq(inventoryItemUomConversions.uomId, uom.id))
      .where(eq(inventoryItemUomConversions.id, id));
    return rows[0] as ConversionWithUom | undefined;
  }

  // Returns an override by composite key (inventory item + UOM) for duplicate detection
  async findByInventoryItemAndUom(
    inventoryItemId: string,
    uomId: string,
  ): Promise<InventoryItemUomConversion | undefined> {
    return this.model.findFirst({ where: { inventoryItemId, uomId } });
  }

  // Returns the primary UOM ID for a given inventory item
  async findInventoryItemPrimaryUomId(inventoryItemId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1);
    return row?.uomId;
  }

  // True when a supplier item is priced in this (inventory item, UOM) pair — deleting the
  // conversion would orphan it, so the delete is blocked.
  async isUsedBySupplierItem(inventoryItemId: string, uomId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql<number>`1` })
      .from(supplierItems)
      .where(and(eq(supplierItems.inventoryItemId, inventoryItemId), eq(supplierItems.uomId, uomId)))
      .limit(1);
    return !!row;
  }

  // UOM ids referenced by supplier items for this inventory item — drives per-row canDelete.
  async findUomIdsUsedBySupplierItems(inventoryItemId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ uomId: supplierItems.uomId })
      .from(supplierItems)
      .where(eq(supplierItems.inventoryItemId, inventoryItemId));
    return rows.map((r) => r.uomId);
  }
}
