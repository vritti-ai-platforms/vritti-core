import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemLot, inventoryItemLots, inventoryItemQuants } from '@/db/schema';

export type InventoryItemLotWithStock = InventoryItemLot & {
  stockedQuantity: string;
  reservedQuantity: string;
};

@Injectable()
export class InventoryItemLotsDomainRepository extends PrimaryBaseRepository<typeof inventoryItemLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemLots);
  }

  async findLotsForTable(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InventoryItemLotWithStock[]; count: number }> {
    const baseWhere = eq(inventoryItemLots.inventoryItemId, inventoryItemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<InventoryItemLotWithStock>({
      select: {
        id: inventoryItemLots.id,
        organizationId: inventoryItemLots.organizationId,
        siteId: inventoryItemLots.siteId,
        inventoryItemId: inventoryItemLots.inventoryItemId,
        lotNumber: inventoryItemLots.lotNumber,
        manufacturingDate: inventoryItemLots.manufacturingDate,
        expiryDate: inventoryItemLots.expiryDate,
        mrp: inventoryItemLots.mrp,
        createdAt: inventoryItemLots.createdAt,
        updatedAt: inventoryItemLots.updatedAt,
        stockedQuantity: sql<string>`COALESCE(SUM(${inventoryItemQuants.quantity}), 0)`.as('stockedQuantity'),
        reservedQuantity: sql<string>`COALESCE(SUM(${inventoryItemQuants.reservedQuantity}), 0)`.as('reservedQuantity'),
      },
      leftJoins: [{ table: inventoryItemQuants, on: eq(inventoryItemQuants.lotId, inventoryItemLots.id) }],
      groupBy: [inventoryItemLots.id],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(inventoryItemLots.expiryDate)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Checks if a lot already exists for this item
  async findByItemAndNumber(inventoryItemId: string, lotNumber: string): Promise<InventoryItemLot | undefined> {
    const rows = await this.db
      .select()
      .from(inventoryItemLots)
      .where(and(eq(inventoryItemLots.inventoryItemId, inventoryItemId), eq(inventoryItemLots.lotNumber, lotNumber)))
      .limit(1);
    return rows[0] as InventoryItemLot | undefined;
  }

  async createLot(data: typeof inventoryItemLots.$inferInsert): Promise<InventoryItemLot> {
    const results = await this.db.insert(inventoryItemLots).values(data).returning();
    return results[0] as InventoryItemLot;
  }

  async updateMrp(id: string, mrp: bigint | null): Promise<void> {
    await this.db.update(inventoryItemLots).set({ mrp }).where(eq(inventoryItemLots.id, id));
  }
}
