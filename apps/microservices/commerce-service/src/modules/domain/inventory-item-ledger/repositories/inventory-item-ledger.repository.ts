import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { asc, desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemLedgerEntry,
  inventoryItemLedger,
  inventoryItems,
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
    result: (InventoryItemLedgerEntry & { inventoryItemName: string })[];
    count: number;
  }> {
    return this.findAllAndCount<InventoryItemLedgerEntry & { inventoryItemName: string }>({
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

  // Stable-ordered page for the mobile Relay ledger feed, scoped to one item: newest first with an id
  // tie-breaker so offset cursors are deterministic. Reuses findAllForTable's select + item-name join.
  async findLedgerFeedPage(
    inventoryItemId: string,
    limit: number,
    offset: number,
  ): Promise<{ result: (InventoryItemLedgerEntry & { inventoryItemName: string })[]; count: number }> {
    return this.findAllForTable({
      where: eq(inventoryItemLedger.inventoryItemId, inventoryItemId),
      orderBy: [desc(inventoryItemLedger.createdAt), asc(inventoryItemLedger.id)],
      limit,
      offset,
    });
  }
}
