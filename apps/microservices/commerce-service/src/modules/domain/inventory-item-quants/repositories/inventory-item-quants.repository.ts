import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemQuant,
  type InventoryItemSerial,
  type InventoryTracking,
  inventoryItemLots,
  inventoryItemQuants,
  inventoryItemSerials,
  inventoryItems,
  inventoryStockLevels,
  locations,
  SerialStatusValues,
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

  async findQuantsForTable(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InventoryItemQuantWithRefs[]; count: number }> {
    const baseWhere = eq(inventoryItemQuants.inventoryItemId, inventoryItemId);
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

  async updateQuantity(id: string, delta: number): Promise<InventoryItemQuant> {
    const results = await this.db
      .update(inventoryItemQuants)
      .set({
        quantity: sql`${inventoryItemQuants.quantity} + ${delta}::decimal`,
      })
      .where(eq(inventoryItemQuants.id, id))
      .returning();

    return results[0] as InventoryItemQuant;
  }

  async createBatch(data: typeof inventoryItemQuants.$inferInsert): Promise<InventoryItemQuant> {
    const results = await this.db.insert(inventoryItemQuants).values(data).returning();
    return results[0] as InventoryItemQuant;
  }

  // Updates the denormalized total_unit_cost on a quant. The cost-association service recomputes
  // this from SUM(allocated_amount across all junction rows) / quantity each time a cost row
  // affecting the quant is inserted, edited, or deleted.
  async updateTotalUnitCost(id: string, totalUnitCost: bigint): Promise<void> {
    await this.db.update(inventoryItemQuants).set({ totalUnitCost }).where(eq(inventoryItemQuants.id, id));
  }

  // Per-source quant lookup — used by autoAssociatePoPrice (gr.id) and by associateCost when
  // targetQuantIds is omitted.
  async findBySource(sourceType: string, sourceId: string): Promise<InventoryItemQuant[]> {
    const rows = await this.db
      .select()
      .from(inventoryItemQuants)
      .where(and(eq(inventoryItemQuants.sourceType, sourceType as never), eq(inventoryItemQuants.sourceId, sourceId)));
    return rows as InventoryItemQuant[];
  }

  // Quants resolved from a specific GR-item (via gr_lines.resolved_quant_id). Used by
  // autoAssociatePoPrice to scope the cost row's junction rows to just the lines for one GR-item.
  async findByGrItemId(grItemId: string): Promise<InventoryItemQuant[]> {
    const rows = await this.db
      .select()
      .from(inventoryItemQuants)
      .where(
        sql`${inventoryItemQuants.id} IN (
          SELECT resolved_quant_id FROM ${sql.identifier('vritti_core')}.goods_receipt_lines
          WHERE goods_receipt_item_id = ${grItemId} AND resolved_quant_id IS NOT NULL
        )`,
      );
    return rows as InventoryItemQuant[];
  }

  // Loads a set of quants by ID — used by associateCostInternal to score the distribution math.
  async findByIds(ids: string[]): Promise<InventoryItemQuant[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.select().from(inventoryItemQuants).where(inArray(inventoryItemQuants.id, ids));
    return rows as InventoryItemQuant[];
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

  // Inserts one row per serial number into inventory_item_serials (status='AVAILABLE')
  async insertQuantItems(
    items: { inventoryItemQuantId: string; inventoryItemId: string; serialNumber: string }[],
  ): Promise<InventoryItemSerial[]> {
    if (items.length === 0) return [];
    const results = await this.db
      .insert(inventoryItemSerials)
      .values(
        items.map((item) => ({
          inventoryItemQuantId: item.inventoryItemQuantId,
          inventoryItemId: item.inventoryItemId,
          serialNumber: item.serialNumber,
          status: SerialStatusValues.AVAILABLE,
        })),
      )
      .returning();
    return results as InventoryItemSerial[];
  }

  // Returns the single serial row matching (item, serial) along with its parent quant + status.
  // Used by callers that need to validate serial uniqueness or AVAILABLE-vs-parent-quant binding.
  async findSerial(
    inventoryItemId: string,
    serialNumber: string,
  ): Promise<{ id: string; inventoryItemQuantId: string | null; status: string } | null> {
    const rows = await this.db
      .select({
        id: inventoryItemSerials.id,
        inventoryItemQuantId: inventoryItemSerials.inventoryItemQuantId,
        status: inventoryItemSerials.status,
      })
      .from(inventoryItemSerials)
      .where(
        and(
          eq(inventoryItemSerials.inventoryItemId, inventoryItemId),
          eq(inventoryItemSerials.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    return (rows[0] as { id: string; inventoryItemQuantId: string | null; status: string } | undefined) ?? null;
  }

  // Validate serials belong to a quant and are AVAILABLE by serial number; returns the rows
  async loadAvailableQuantItemsBySerials(quantId: string, serials: string[]): Promise<InventoryItemSerial[]> {
    if (serials.length === 0) return [];
    const rows = await this.db
      .select()
      .from(inventoryItemSerials)
      .where(
        and(
          eq(inventoryItemSerials.inventoryItemQuantId, quantId),
          eq(inventoryItemSerials.status, SerialStatusValues.AVAILABLE),
          inArray(inventoryItemSerials.serialNumber, serials),
        ),
      );
    return rows as InventoryItemSerial[];
  }

  // Marks the given serials as CONSUMED (by id)
  async consumeQuantItems(quantItemIds: string[]): Promise<void> {
    if (quantItemIds.length === 0) return;
    await this.db
      .update(inventoryItemSerials)
      .set({ status: SerialStatusValues.CONSUMED })
      .where(inArray(inventoryItemSerials.id, quantItemIds));
  }

  async findLocationStockByInventoryItemId(inventoryItemId: string): Promise<
    {
      locationId: string;
      locationName: string | null;
      locationPath: string | null;
      stockedQuantity: string;
      reservedQuantity: string;
      availableQuantity: string;
      reorderLevel: number | null;
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
      .where(eq(inventoryStockLevels.inventoryItemId, inventoryItemId));
  }
}
