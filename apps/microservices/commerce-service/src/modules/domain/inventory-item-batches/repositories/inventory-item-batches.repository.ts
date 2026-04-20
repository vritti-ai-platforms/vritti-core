import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemBatch,
  inventoryItemBatches,
  inventoryItemBatchNumberSeq,
  inventoryItems,
  inventoryLevels,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class InventoryItemBatchesRepository extends PrimaryBaseRepository<typeof inventoryItemBatches> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemBatches, { sequence: inventoryItemBatchNumberSeq });
  }

  async findBatchesForTable(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (InventoryItemBatch & { locationName: string | null })[]; count: number }> {
    const baseWhere = eq(inventoryItemBatches.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<InventoryItemBatch & { locationName: string | null }>({
      select: {
        id: inventoryItemBatches.id,
        organizationId: inventoryItemBatches.organizationId,
        businessUnitId: inventoryItemBatches.businessUnitId,
        inventoryItemId: inventoryItemBatches.inventoryItemId,
        locationId: inventoryItemBatches.locationId,
        batchNumber: inventoryItemBatches.batchNumber,
        quantity: inventoryItemBatches.quantity,
        reservedQuantity: inventoryItemBatches.reservedQuantity,
        manufacturingDate: inventoryItemBatches.manufacturingDate,
        expiryDate: inventoryItemBatches.expiryDate,
        goodsReceiptItemId: inventoryItemBatches.goodsReceiptItemId,
        createdAt: inventoryItemBatches.createdAt,
        updatedAt: inventoryItemBatches.updatedAt,
        locationName: storageLocations.name,
      },
      leftJoins: [{ table: storageLocations, on: eq(inventoryItemBatches.locationId, storageLocations.id) }],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemBatches.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findById(id: string): Promise<(InventoryItemBatch & { locationName: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: inventoryItemBatches.id,
        organizationId: inventoryItemBatches.organizationId,
        businessUnitId: inventoryItemBatches.businessUnitId,
        inventoryItemId: inventoryItemBatches.inventoryItemId,
        locationId: inventoryItemBatches.locationId,
        batchNumber: inventoryItemBatches.batchNumber,
        quantity: inventoryItemBatches.quantity,
        reservedQuantity: inventoryItemBatches.reservedQuantity,
        manufacturingDate: inventoryItemBatches.manufacturingDate,
        expiryDate: inventoryItemBatches.expiryDate,
        goodsReceiptItemId: inventoryItemBatches.goodsReceiptItemId,
        createdAt: inventoryItemBatches.createdAt,
        updatedAt: inventoryItemBatches.updatedAt,
        locationName: storageLocations.name,
      })
      .from(inventoryItemBatches)
      .leftJoin(storageLocations, eq(inventoryItemBatches.locationId, storageLocations.id))
      .where(eq(inventoryItemBatches.id, id));

    return rows[0] as (InventoryItemBatch & { locationName: string | null }) | undefined;
  }

  async updateQuantity(id: string, delta: string): Promise<InventoryItemBatch> {
    const results = await this.db
      .update(inventoryItemBatches)
      .set({
        quantity: sql`${inventoryItemBatches.quantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemBatches.id, id))
      .returning();

    return results[0] as InventoryItemBatch;
  }

  async updateQuantityWithTx(tx: TypedDrizzleClient, id: string, delta: string): Promise<InventoryItemBatch> {
    const results = await tx
      .update(inventoryItemBatches)
      .set({
        quantity: sql`${inventoryItemBatches.quantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemBatches.id, id))
      .returning();

    return results[0] as InventoryItemBatch;
  }

  async updateReservedQuantity(id: string, delta: string): Promise<InventoryItemBatch> {
    const results = await this.db
      .update(inventoryItemBatches)
      .set({
        reservedQuantity: sql`${inventoryItemBatches.reservedQuantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemBatches.id, id))
      .returning();

    return results[0] as InventoryItemBatch;
  }

  async createWithTx(
    tx: TypedDrizzleClient,
    data: typeof inventoryItemBatches.$inferInsert,
  ): Promise<InventoryItemBatch> {
    const results = await tx.insert(inventoryItemBatches).values(data).returning();
    return results[0] as InventoryItemBatch;
  }

  async deleteBatch(id: string): Promise<void> {
    await this.db.delete(inventoryItemBatches).where(eq(inventoryItemBatches.id, id));
  }

  async setBatchItemMirror(data: {
    inventoryItemBatchId: string;
    inventoryItemId: string;
    quantity: string;
    reservedQuantity: string;
  }): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO vritti_core.inventory_item_batch_items (
        organization_id,
        business_unit_id,
        inventory_item_batch_id,
        inventory_item_id,
        quantity,
        reserved_quantity
      )
      VALUES (
        current_setting('app.org_id')::uuid,
        current_setting('app.bu_id')::uuid,
        ${data.inventoryItemBatchId}::uuid,
        ${data.inventoryItemId}::uuid,
        ${data.quantity}::numeric,
        ${data.reservedQuantity}::numeric
      )
      ON CONFLICT (inventory_item_batch_id, inventory_item_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        reserved_quantity = EXCLUDED.reserved_quantity,
        updated_at = now()
    `);
  }

  async setBatchItemMirrorWithTx(
    tx: TypedDrizzleClient,
    data: {
      inventoryItemBatchId: string;
      inventoryItemId: string;
      quantity: string;
      reservedQuantity: string;
    },
  ): Promise<void> {
    await tx.execute(sql`
      INSERT INTO vritti_core.inventory_item_batch_items (
        organization_id,
        business_unit_id,
        inventory_item_batch_id,
        inventory_item_id,
        quantity,
        reserved_quantity
      )
      VALUES (
        current_setting('app.org_id')::uuid,
        current_setting('app.bu_id')::uuid,
        ${data.inventoryItemBatchId}::uuid,
        ${data.inventoryItemId}::uuid,
        ${data.quantity}::numeric,
        ${data.reservedQuantity}::numeric
      )
      ON CONFLICT (inventory_item_batch_id, inventory_item_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        reserved_quantity = EXCLUDED.reserved_quantity,
        updated_at = now()
    `);
  }

  async findLocationStockByItemId(itemId: string): Promise<
    {
      locationId: string;
      locationName: string | null;
      stockedQuantity: string;
      reservedQuantity: string;
      availableQuantity: string;
      reorderLevel: string | null;
    }[]
  > {
    return this.db
      .select({
        locationId: inventoryLevels.locationId,
        locationName: storageLocations.name,
        stockedQuantity: inventoryLevels.stockedQuantity,
        reservedQuantity: inventoryLevels.reservedQuantity,
        availableQuantity: inventoryLevels.availableQuantity,
        reorderLevel: inventoryLevels.reorderLevel,
      })
      .from(inventoryLevels)
      .leftJoin(storageLocations, eq(inventoryLevels.locationId, storageLocations.id))
      .where(eq(inventoryLevels.inventoryItemId, itemId));
  }

  // Generates a batch number: {ITEM_CODE}-{YYMMDD}-{NNNN} (org-scoped sequence per item per day)
  async generateBatchNumber(itemId: string, mfd?: string): Promise<string> {
    const date = mfd ?? new Date().toISOString().slice(0, 10);
    const dateCompact = date.replace(/-/g, '').slice(2);
    const itemCode = await this.findItemCode(itemId);
    const nextNumber = await this.nextSequenceValue();
    return `${itemCode}-${dateCompact}-${String(nextNumber).padStart(4, '0')}`;
  }

  private async findItemCode(itemId: string): Promise<string> {
    const [row] = await this.db
      .select({ code: inventoryItems.code })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    return row?.code ?? '';
  }
}
