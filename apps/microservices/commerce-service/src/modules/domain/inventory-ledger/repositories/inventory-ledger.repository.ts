import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryLedgerEntry,
  inventoryItemBatches,
  inventoryItems,
  inventoryLedger,
  type NewInventoryLedgerEntry,
} from '@/db/schema';

@Injectable()
export class InventoryLedgerRepository extends PrimaryBaseRepository<typeof inventoryLedger> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryLedger);
  }

  async createEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }

  async createEntryWithTx(tx: TypedDrizzleClient, data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await tx.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }

  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (InventoryLedgerEntry & { inventoryItemName: string | null; batchNumber: string | null })[];
    count: number;
  }> {
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLedger)
      .leftJoin(inventoryItems, eq(inventoryLedger.inventoryItemId, inventoryItems.id))
      .where(options.where);

    const result = await this.db
      .select({
        id: inventoryLedger.id,
        organizationId: inventoryLedger.organizationId,
        businessUnitId: inventoryLedger.businessUnitId,
        inventoryItemId: inventoryLedger.inventoryItemId,
        batchId: inventoryLedger.batchId,
        type: inventoryLedger.type,
        quantity: inventoryLedger.quantity,
        referenceType: inventoryLedger.referenceType,
        referenceId: inventoryLedger.referenceId,
        notes: inventoryLedger.notes,
        createdAt: inventoryLedger.createdAt,
        inventoryItemName: inventoryItems.name,
        batchNumber: inventoryItemBatches.batchNumber,
      })
      .from(inventoryLedger)
      .leftJoin(inventoryItems, eq(inventoryLedger.inventoryItemId, inventoryItems.id))
      .leftJoin(inventoryItemBatches, eq(inventoryLedger.batchId, inventoryItemBatches.id))
      .where(options.where)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(inventoryLedger.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    return {
      result: result as (InventoryLedgerEntry & { inventoryItemName: string | null; batchNumber: string | null })[],
      count: Number(countResult?.count ?? 0),
    };
  }

  async findByBatchId(
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

  async findByReference(referenceType: string, referenceId: string): Promise<InventoryLedgerEntry[]> {
    return this.db
      .select()
      .from(inventoryLedger)
      .where(
        and(eq(inventoryLedger.referenceType, referenceType), eq(inventoryLedger.referenceId, referenceId)),
      ) as Promise<InventoryLedgerEntry[]>;
  }

  async hasNonOpeningEntries(batchId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLedger)
      .where(and(eq(inventoryLedger.batchId, batchId), sql`${inventoryLedger.type} NOT IN ('OPENING_STOCK')`));

    return Number(result?.count ?? 0) > 0;
  }
}
