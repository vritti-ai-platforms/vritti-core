import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  inventoryItemLedger,
  type InventoryItemLedgerEntry,
  type InventoryItemLedgerReferenceType,
  type NewInventoryItemLedgerEntry,
} from '@/db/schema';

@Injectable()
export class InventoryItemLedgerRepository extends PrimaryBaseRepository<typeof inventoryItemLedger> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLedger);
  }

  // Inserts a new ledger entry and returns it
  async createEntry(data: NewInventoryItemLedgerEntry): Promise<InventoryItemLedgerEntry> {
    const results = await this.db.insert(inventoryItemLedger).values(data).returning();
    return results[0] as InventoryItemLedgerEntry;
  }

  // Returns paginated ledger entries joined with item name for the data table
  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (InventoryItemLedgerEntry & { inventoryItemName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<InventoryItemLedgerEntry & { inventoryItemName: string | null }>({
      select: {
        id: inventoryItemLedger.id,
        organizationId: inventoryItemLedger.organizationId,
        businessUnitId: inventoryItemLedger.businessUnitId,
        inventoryItemId: inventoryItemLedger.inventoryItemId,
        type: inventoryItemLedger.type,
        quantity: inventoryItemLedger.quantity,
        referenceType: inventoryItemLedger.referenceType,
        referenceId: inventoryItemLedger.referenceId,
        notes: inventoryItemLedger.notes,
        createdAt: inventoryItemLedger.createdAt,
        inventoryItemName: inventoryItems.name,
      },
      leftJoins: [{ table: inventoryItems, on: eq(inventoryItemLedger.inventoryItemId, inventoryItems.id) }],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemLedger.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns all ledger entries for a given reference
  async findByReference(referenceType: InventoryItemLedgerReferenceType, referenceId: string): Promise<InventoryItemLedgerEntry[]> {
    return this.db
      .select()
      .from(inventoryItemLedger)
      .where(
        and(eq(inventoryItemLedger.referenceType, referenceType), eq(inventoryItemLedger.referenceId, referenceId)),
      ) as Promise<InventoryItemLedgerEntry[]>;
  }

  // Returns all ledger entries for a given inventory item, newest first
  async findByItemId(itemId: string): Promise<InventoryItemLedgerEntry[]> {
    return this.db
      .select()
      .from(inventoryItemLedger)
      .where(eq(inventoryItemLedger.inventoryItemId, itemId))
      .orderBy(desc(inventoryItemLedger.createdAt)) as Promise<InventoryItemLedgerEntry[]>;
  }
}
