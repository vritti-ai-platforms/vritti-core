import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type SQL, and, desc, eq, ne, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemBatch,
  type InventoryLedgerEntry,
  type NewInventoryLedgerEntry,
  inventoryItemBatches,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
  stockAdjustments,
  storageLocations,
} from '@/db/schema';

@Injectable()
export class InventoryItemBatchesRepository extends PrimaryBaseRepository<typeof inventoryItemBatches> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemBatches);
  }

  // Returns paginated batches for an item with location name and supports canDelete check
  async findBatchesForTable(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (InventoryItemBatch & { locationName: string | null })[]; count: number }> {
    const baseWhere = eq(inventoryItemBatches.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItemBatches)
      .leftJoin(storageLocations, eq(inventoryItemBatches.locationId, storageLocations.id))
      .where(combinedWhere);

    const result = await this.db
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
      .where(combinedWhere)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(inventoryItemBatches.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    return { result: result as (InventoryItemBatch & { locationName: string | null })[], count: Number(countResult?.count ?? 0) };
  }

  // Returns a single batch by ID with location name
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

  // Atomically updates quantity by delta (positive or negative)
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

  // Atomically updates reserved quantity by delta (positive or negative)
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

  // Deletes a batch by ID and all its records
  async deleteBatch(id: string): Promise<void> {
    await this.db.delete(inventoryItemBatches).where(eq(inventoryItemBatches.id, id));
  }

  // Returns true if batch has any ledger entries beyond the initial OPENING_STOCK entry
  async hasOtherLedgerEntries(batchId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLedger)
      .where(
        and(
          eq(inventoryLedger.batchId, batchId),
          ne(inventoryLedger.type, 'OPENING_STOCK'),
        ),
      );

    return Number(result?.count ?? 0) > 0;
  }

  // Creates a new ledger entry
  async createLedgerEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }

  // Returns paginated ledger entries for a batch
  async findLedgerForTable(
    batchId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InventoryLedgerEntry[]; count: number }> {
    const baseWhere = eq(inventoryLedger.batchId, batchId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLedger)
      .where(combinedWhere);

    const result = await this.db
      .select()
      .from(inventoryLedger)
      .where(combinedWhere)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(inventoryLedger.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    return { result: result as InventoryLedgerEntry[], count: Number(countResult?.count ?? 0) };
  }

  // Returns paginated stock adjustments for a batch with inventory item names
  async findAdjustmentsForTable(
    batchId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (typeof stockAdjustments.$inferSelect & { inventoryItemName: string | null })[]; count: number }> {
    const baseWhere = eq(stockAdjustments.batchId, batchId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stockAdjustments)
      .where(combinedWhere);

    const result = await this.db
      .select({
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        batchId: stockAdjustments.batchId,
        locationId: stockAdjustments.locationId,
        type: stockAdjustments.type,
        quantity: stockAdjustments.quantity,
        reason: stockAdjustments.reason,
        adjustedBy: stockAdjustments.adjustedBy,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
      })
      .from(stockAdjustments)
      .leftJoin(inventoryItems, eq(stockAdjustments.inventoryItemId, inventoryItems.id))
      .where(combinedWhere)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    return {
      result: result as (typeof stockAdjustments.$inferSelect & { inventoryItemName: string | null })[],
      count: Number(countResult?.count ?? 0),
    };
  }

  // Returns location stock aggregates from the inventoryLevels view for a given item
  async findLocationStockByItemId(itemId: string): Promise<{
    locationId: string;
    locationName: string | null;
    stockedQuantity: string;
    reservedQuantity: string;
    availableQuantity: string;
    reorderLevel: string | null;
  }[]> {
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

}
