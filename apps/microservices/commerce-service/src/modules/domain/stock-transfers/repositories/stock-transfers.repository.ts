import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, type StockTransfer, stockTransfers } from '@/db/schema';

@Injectable()
export class StockTransfersDomainRepository extends PrimaryBaseRepository<typeof stockTransfers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockTransfers);
  }

  // Returns all stock transfers with inventory item names
  async findAllWithItemNames(params: {
    where?: SQL;
    orderBy?: SQL[];
    limit?: number;
    offset?: number;
  }): Promise<{ result: (StockTransfer & { inventoryItemName: string })[]; count: number }> {
    return this.findAllAndCount<StockTransfer & { inventoryItemName: string }>({
      select: {
        id: stockTransfers.id,
        organizationId: stockTransfers.organizationId,
        inventoryItemId: stockTransfers.inventoryItemId,
        fromSiteId: stockTransfers.fromSiteId,
        toSiteId: stockTransfers.toSiteId,
        quantity: stockTransfers.quantity,
        status: stockTransfers.status,
        requestedBy: stockTransfers.requestedBy,
        receivedBy: stockTransfers.receivedBy,
        notes: stockTransfers.notes,
        createdAt: stockTransfers.createdAt,
        updatedAt: stockTransfers.updatedAt,
        inventoryItemName: inventoryItems.name,
      },
      leftJoins: [{ table: inventoryItems, on: eq(stockTransfers.inventoryItemId, inventoryItems.id) }],
      where: params.where,
      orderBy: params.orderBy?.length ? params.orderBy : [desc(stockTransfers.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }
}
