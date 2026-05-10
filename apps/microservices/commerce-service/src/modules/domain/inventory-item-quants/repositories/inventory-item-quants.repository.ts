import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemLot,
  inventoryItemLots,
  type InventoryItemQuant,
  type InventoryItemQuantItem,
  inventoryItemQuantItems,
  inventoryItemQuants,
  inventoryItems,
  inventoryStockLevels,
  type InventoryTracking,
  QuantItemStatusValues,
  locations,
} from '@/db/schema';

export type InventoryItemQuantWithRefs = InventoryItemQuant & {
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
};

@Injectable()
export class InventoryItemQuantsRepository extends PrimaryBaseRepository<typeof inventoryItemQuants> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemQuants);
  }

  async findBatchesForTable(
    itemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InventoryItemQuantWithRefs[]; count: number }> {
    const baseWhere = eq(inventoryItemQuants.inventoryItemId, itemId);
    const combinedWhere = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<InventoryItemQuantWithRefs>({
      select: {
        id: inventoryItemQuants.id,
        organizationId: inventoryItemQuants.organizationId,
        businessUnitId: inventoryItemQuants.businessUnitId,
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        locationId: inventoryItemQuants.locationId,
        lotId: inventoryItemQuants.lotId,
        quantity: inventoryItemQuants.quantity,
        reservedQuantity: inventoryItemQuants.reservedQuantity,
        createdAt: inventoryItemQuants.createdAt,
        updatedAt: inventoryItemQuants.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        lotNumber: inventoryItemLots.lotNumber,
        manufacturingDate: inventoryItemLots.manufacturingDate,
        expiryDate: inventoryItemLots.expiryDate,
      },
      leftJoins: [
        { table: locations, on: eq(inventoryItemQuants.locationId, locations.id) },
        { table: inventoryItemLots, on: eq(inventoryItemQuants.lotId, inventoryItemLots.id) },
      ],
      where: combinedWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(inventoryItemQuants.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findById(id: string): Promise<InventoryItemQuantWithRefs | undefined> {
    const rows = await this.db
      .select({
        id: inventoryItemQuants.id,
        organizationId: inventoryItemQuants.organizationId,
        businessUnitId: inventoryItemQuants.businessUnitId,
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        locationId: inventoryItemQuants.locationId,
        lotId: inventoryItemQuants.lotId,
        quantity: inventoryItemQuants.quantity,
        reservedQuantity: inventoryItemQuants.reservedQuantity,
        createdAt: inventoryItemQuants.createdAt,
        updatedAt: inventoryItemQuants.updatedAt,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        lotNumber: inventoryItemLots.lotNumber,
        manufacturingDate: inventoryItemLots.manufacturingDate,
        expiryDate: inventoryItemLots.expiryDate,
      })
      .from(inventoryItemQuants)
      .leftJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(eq(inventoryItemQuants.id, id));

    return rows[0] as InventoryItemQuantWithRefs | undefined;
  }

  async updateQuantity(id: string, delta: string): Promise<InventoryItemQuant> {
    const results = await this.db
      .update(inventoryItemQuants)
      .set({
        quantity: sql`${inventoryItemQuants.quantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemQuants.id, id))
      .returning();

    return results[0] as InventoryItemQuant;
  }

  async updateReservedQuantity(id: string, delta: string): Promise<InventoryItemQuant> {
    const results = await this.db
      .update(inventoryItemQuants)
      .set({
        reservedQuantity: sql`${inventoryItemQuants.reservedQuantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemQuants.id, id))
      .returning();

    return results[0] as InventoryItemQuant;
  }

  async createBatch(data: typeof inventoryItemQuants.$inferInsert): Promise<InventoryItemQuant> {
    const results = await this.db.insert(inventoryItemQuants).values(data).returning();
    return results[0] as InventoryItemQuant;
  }

  // Returns the tracking type for an item (none | lot | item)
  async findItemTracking(inventoryItemId: string): Promise<InventoryTracking> {
    const rows = await this.db
      .select({ tracking: inventoryItems.tracking })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1);
    const tracking = rows[0]?.tracking;
    if (!tracking) throw new Error(`Inventory item ${inventoryItemId} not found.`);
    return tracking;
  }

  // Find an existing quant by item + location + lotId. lotId=null matches NULL (tracking='quantity').
  async findByItemLocationLot(
    inventoryItemId: string,
    locationId: string,
    lotId: string | null,
  ): Promise<InventoryItemQuant | undefined> {
    const condition =
      lotId != null
        ? and(
            eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
            eq(inventoryItemQuants.locationId, locationId),
            eq(inventoryItemQuants.lotId, lotId),
          )
        : and(
            eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
            eq(inventoryItemQuants.locationId, locationId),
            sql`${inventoryItemQuants.lotId} IS NULL`,
          );
    const rows = await this.db.select().from(inventoryItemQuants).where(condition).limit(1);
    return rows[0] as InventoryItemQuant | undefined;
  }

  // Inserts one row per serial number into inventory_item_quant_items (status='AVAILABLE')
  async insertQuantItems(
    items: { inventoryItemQuantId: string; inventoryItemId: string; serialNumber: string }[],
  ): Promise<InventoryItemQuantItem[]> {
    if (items.length === 0) return [];
    const results = await this.db
      .insert(inventoryItemQuantItems)
      .values(
        items.map((item) => ({
          inventoryItemQuantId: item.inventoryItemQuantId,
          inventoryItemId: item.inventoryItemId,
          serialNumber: item.serialNumber,
          status: QuantItemStatusValues.AVAILABLE,
        })),
      )
      .returning();
    return results as InventoryItemQuantItem[];
  }

  // Validate quant items belong to a quant and are AVAILABLE by serial number; returns the rows
  async loadAvailableQuantItemsBySerials(
    quantId: string,
    serials: string[],
  ): Promise<InventoryItemQuantItem[]> {
    if (serials.length === 0) return [];
    const rows = await this.db
      .select()
      .from(inventoryItemQuantItems)
      .where(
        and(
          eq(inventoryItemQuantItems.inventoryItemQuantId, quantId),
          eq(inventoryItemQuantItems.status, QuantItemStatusValues.AVAILABLE),
          inArray(inventoryItemQuantItems.serialNumber, serials),
        ),
      );
    return rows as InventoryItemQuantItem[];
  }

  // Marks the given quant items as CONSUMED (by id)
  async consumeQuantItems(quantItemIds: string[]): Promise<void> {
    if (quantItemIds.length === 0) return;
    await this.db
      .update(inventoryItemQuantItems)
      .set({ status: QuantItemStatusValues.CONSUMED })
      .where(inArray(inventoryItemQuantItems.id, quantItemIds));
  }

  // Loads the lot row associated with a quant (null when tracking='quantity')
  async findLotByQuantId(quantId: string): Promise<InventoryItemLot | null> {
    const rows = await this.db
      .select({
        id: inventoryItemLots.id,
        organizationId: inventoryItemLots.organizationId,
        businessUnitId: inventoryItemLots.businessUnitId,
        inventoryItemId: inventoryItemLots.inventoryItemId,
        lotNumber: inventoryItemLots.lotNumber,
        manufacturingDate: inventoryItemLots.manufacturingDate,
        expiryDate: inventoryItemLots.expiryDate,
        createdAt: inventoryItemLots.createdAt,
        updatedAt: inventoryItemLots.updatedAt,
      })
      .from(inventoryItemQuants)
      .innerJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(eq(inventoryItemQuants.id, quantId))
      .limit(1);
    return (rows[0] as InventoryItemLot | undefined) ?? null;
  }

  async deleteBatch(id: string): Promise<void> {
    await this.db.delete(inventoryItemQuants).where(eq(inventoryItemQuants.id, id));
  }

  async findLocationStockByItemId(itemId: string): Promise<
    {
      locationId: string;
      locationName: string | null;
      locationPath: string | null;
      stockedQuantity: string;
      reservedQuantity: string;
      availableQuantity: string;
      reorderLevel: string | null;
    }[]
  > {
    return this.db
      .select({
        locationId: inventoryStockLevels.locationId,
        locationName: locations.name,
        locationPath: locations.pathBreadcrumb,
        stockedQuantity: inventoryStockLevels.stockedQuantity,
        reservedQuantity: inventoryStockLevels.reservedQuantity,
        availableQuantity: inventoryStockLevels.availableQuantity,
        reorderLevel: inventoryStockLevels.reorderLevel,
      })
      .from(inventoryStockLevels)
      .leftJoin(locations, eq(inventoryStockLevels.locationId, locations.id))
      .where(eq(inventoryStockLevels.inventoryItemId, itemId));
  }
}
