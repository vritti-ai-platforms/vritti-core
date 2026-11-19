import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type DisplayUnitRatios,
  displayUnitRatios,
  type InventoryItemLedgerEntry,
  inventoryItemLedger,
  inventoryItems,
  type NewInventoryItemLedgerEntry,
} from '@/db/schema';

export type InventoryItemLedgerRow = InventoryItemLedgerEntry & {
  inventoryItemName: string;
  displayUnitRatios: DisplayUnitRatios;
};

@Injectable()
export class InventoryItemLedgerDomainRepository extends PrimaryBaseRepository<typeof inventoryItemLedger> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLedger);
  }

  // Inserts a new ledger entry and returns it
  async createEntry(data: NewInventoryItemLedgerEntry): Promise<InventoryItemLedgerEntry> {
    const results = await this.db.insert(inventoryItemLedger).values(data).returning();
    return results[0] as InventoryItemLedgerEntry;
  }

  // Returns paginated ledger entries joined with item name and its display-unit ratios for the data table
  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: InventoryItemLedgerRow[];
    count: number;
  }> {
    return this.findAllAndCount<InventoryItemLedgerRow>({
      select: {
        id: inventoryItemLedger.id,
        organizationId: inventoryItemLedger.organizationId,
        siteId: inventoryItemLedger.siteId,
        inventoryItemId: inventoryItemLedger.inventoryItemId,
        type: inventoryItemLedger.type,
        quantity: inventoryItemLedger.quantity,
        referenceType: inventoryItemLedger.referenceType,
        referenceId: inventoryItemLedger.referenceId,
        notes: inventoryItemLedger.notes,
        createdAt: inventoryItemLedger.createdAt,
        inventoryItemName: inventoryItems.name,
        displayUnitRatios: displayUnitRatios(),
      },
      leftJoins: [{ table: inventoryItems, on: eq(inventoryItemLedger.inventoryItemId, inventoryItems.id) }],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemLedger.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Keyset page for the mobile Relay ledger feed.
  async findLedgerFeedKeyset(options: { where?: SQL; orderBy: SQL[]; limit: number }): Promise<{
    rows: InventoryItemLedgerRow[];
    hasMore: boolean;
  }> {
    return this.findKeyset<InventoryItemLedgerRow>({
      select: {
        id: inventoryItemLedger.id,
        organizationId: inventoryItemLedger.organizationId,
        siteId: inventoryItemLedger.siteId,
        inventoryItemId: inventoryItemLedger.inventoryItemId,
        type: inventoryItemLedger.type,
        quantity: inventoryItemLedger.quantity,
        referenceType: inventoryItemLedger.referenceType,
        referenceId: inventoryItemLedger.referenceId,
        notes: inventoryItemLedger.notes,
        createdAt: inventoryItemLedger.createdAt,
        inventoryItemName: inventoryItems.name,
        displayUnitRatios: displayUnitRatios(),
      },
      leftJoins: [{ table: inventoryItems, on: eq(inventoryItemLedger.inventoryItemId, inventoryItems.id) }],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  }
}
