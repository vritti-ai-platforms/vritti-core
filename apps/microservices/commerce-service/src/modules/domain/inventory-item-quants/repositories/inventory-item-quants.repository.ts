import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, gt, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
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
  uom,
} from '@/db/schema';

export type InventoryItemQuantWithRefs = InventoryItemQuant & {
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
};

// One grouped row of a location's stocked items (summed across that item's non-zero quants).
export interface LocationItemRow {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  uomSymbol: string | null;
  totalQuantity: number;
  reservedQuantity: number;
  totalValueMinor: bigint;
  costCurrency: string | null;
  batchCount: number;
}

// One per-quant breakdown row for a single (location, item) pair.
export interface LocationItemQuantRow {
  quantId: string;
  lotNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  reservedQuantity: number;
  unitCost: bigint;
  costCurrency: string | null;
  quantValue: bigint;
}

export interface GrItemQuantCostRow {
  quantId: string;
  locationName: string | null;
  lotNumber: string | null;
  quantity: number;
  unitCost: bigint;
  quantCost: bigint;
  quantValue: bigint;
  costCurrency: string | null;
}

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
        siteId: inventoryItemQuants.siteId,
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        locationId: inventoryItemQuants.locationId,
        lotId: inventoryItemQuants.lotId,
        quantity: inventoryItemQuants.quantity,
        reservedQuantity: inventoryItemQuants.reservedQuantity,
        unitCost: inventoryItemQuants.unitCost,
        costCurrency: inventoryItemQuants.costCurrency,
        quantCost: inventoryItemQuants.quantCost,
        quantValue: inventoryItemQuants.quantValue,
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
        siteId: inventoryItemQuants.siteId,
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        locationId: inventoryItemQuants.locationId,
        lotId: inventoryItemQuants.lotId,
        quantity: inventoryItemQuants.quantity,
        reservedQuantity: inventoryItemQuants.reservedQuantity,
        unitCost: inventoryItemQuants.unitCost,
        costCurrency: inventoryItemQuants.costCurrency,
        quantCost: inventoryItemQuants.quantCost,
        quantValue: inventoryItemQuants.quantValue,
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

  // Decrements quant_value by ROUND(unit_cost × qtyOut); clears it to 0 once quantity has reached 0
  // (read post-decrement), absorbing the rounding residual on final depletion.
  async applyOutflowValue(quantId: string, qtyOut: number): Promise<InventoryItemQuant> {
    const results = await this.db
      .update(inventoryItemQuants)
      .set({
        quantValue: sql`CASE WHEN ${inventoryItemQuants.quantity} = 0 THEN 0
          ELSE GREATEST(0, ${inventoryItemQuants.quantValue} - ROUND(${inventoryItemQuants.unitCost}::numeric * ${qtyOut})::bigint) END`,
      })
      .where(eq(inventoryItemQuants.id, quantId))
      .returning();
    return results[0] as InventoryItemQuant;
  }

  // Adds to both quant_cost and quant_value (a freshly received slice or a positive adjust inflow).
  async addQuantCostValue(quantId: string, addCost: bigint, addValue: bigint): Promise<InventoryItemQuant> {
    const results = await this.db
      .update(inventoryItemQuants)
      .set({
        quantCost: sql`${inventoryItemQuants.quantCost} + ${addCost}`,
        quantValue: sql`${inventoryItemQuants.quantValue} + ${addValue}`,
      })
      .where(eq(inventoryItemQuants.id, quantId))
      .returning();
    return results[0] as InventoryItemQuant;
  }

  async createQuant(data: typeof inventoryItemQuants.$inferInsert): Promise<InventoryItemQuant> {
    const results = await this.db.insert(inventoryItemQuants).values(data).returning();
    return results[0] as InventoryItemQuant;
  }

  // Quants resolved from a GR-item's lines, with location + lot labels and the denormalized landed
  // cost. Powers the Items Cost tab's per-item "view quants & cost" dialog.
  async findCostsByGrItemId(grItemId: string): Promise<GrItemQuantCostRow[]> {
    const rows = await this.db
      .select({
        quantId: inventoryItemQuants.id,
        locationName: locations.name,
        lotNumber: inventoryItemLots.lotNumber,
        quantity: inventoryItemQuants.quantity,
        unitCost: inventoryItemQuants.unitCost,
        quantCost: inventoryItemQuants.quantCost,
        quantValue: inventoryItemQuants.quantValue,
        costCurrency: inventoryItemQuants.costCurrency,
      })
      .from(inventoryItemQuants)
      .leftJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(
        sql`${inventoryItemQuants.id} IN (
          SELECT resolved_quant_id FROM ${sql.identifier('vritti_core')}.goods_receipt_lines
          WHERE goods_receipt_item_id = ${grItemId} AND resolved_quant_id IS NOT NULL
        )`,
      )
      .orderBy(inventoryItemQuants.createdAt);
    return rows.map((r) => ({
      ...r,
      unitCost: BigInt(r.unitCost as unknown as string),
      quantCost: BigInt(r.quantCost as unknown as string),
      quantValue: BigInt(r.quantValue as unknown as string),
    }));
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
  // Quant identity for merging includes unit_cost: stock at the same (item, location, lot) but a
  // different cost is a distinct cost batch and must not be merged.
  async findByItemLocationLotCost(
    inventoryItemId: string,
    locationId: string,
    lotId: string | null,
    unitCost: bigint,
  ): Promise<InventoryItemQuant | undefined> {
    const condition = and(
      eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
      eq(inventoryItemQuants.locationId, locationId),
      eq(inventoryItemQuants.unitCost, unitCost),
      lotId != null ? eq(inventoryItemQuants.lotId, lotId) : sql`${inventoryItemQuants.lotId} IS NULL`,
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

  // Groups a location's non-zero quants by inventory item: SUM(quantity), SUM(reserved),
  // SUM(quant_value), COUNT(*) as batchCount, joined to item name/code and uom symbol. Uses
  // findAllAndCount (count = distinct items) with the caller's FilterProcessor where/orderBy + pagination.
  async findItemsForLocation(
    locationId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: LocationItemRow[]; count: number }> {
    const baseWhere = and(eq(inventoryItemQuants.locationId, locationId), gt(inventoryItemQuants.quantity, 0));
    const where = options.where ? and(baseWhere, options.where) : baseWhere;

    return this.findAllAndCount<LocationItemRow>({
      select: {
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        itemName: inventoryItems.name,
        itemCode: inventoryItems.code,
        uomSymbol: uom.symbol,
        totalQuantity: sql<number>`SUM(${inventoryItemQuants.quantity})`.mapWith(Number),
        reservedQuantity: sql<number>`SUM(${inventoryItemQuants.reservedQuantity})`.mapWith(Number),
        totalValueMinor: sql<bigint>`SUM(${inventoryItemQuants.quantValue})`.mapWith((v) => BigInt(v ?? '0')),
        costCurrency: sql<string | null>`MAX(${inventoryItemQuants.costCurrency})`,
        batchCount: sql<number>`COUNT(*)`.mapWith(Number),
      },
      leftJoins: [
        { table: inventoryItems, on: eq(inventoryItemQuants.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      groupBy: [inventoryItemQuants.inventoryItemId, inventoryItems.name, inventoryItems.code, uom.symbol],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(inventoryItems.name)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Per-quant breakdown for a single (location, item): non-zero quants joined to locations + lots,
  // selecting quantity, reservedQuantity, unit cost, cost currency, quant value, lot number, and
  // expiry date. Ordered by creation for a stable, FIFO-ish display.
  async findItemBreakdownForLocation(locationId: string, inventoryItemId: string): Promise<LocationItemQuantRow[]> {
    const rows = await this.db
      .select({
        quantId: inventoryItemQuants.id,
        lotNumber: inventoryItemLots.lotNumber,
        expiryDate: inventoryItemLots.expiryDate,
        quantity: inventoryItemQuants.quantity,
        reservedQuantity: inventoryItemQuants.reservedQuantity,
        unitCost: inventoryItemQuants.unitCost,
        costCurrency: inventoryItemQuants.costCurrency,
        quantValue: inventoryItemQuants.quantValue,
      })
      .from(inventoryItemQuants)
      .innerJoin(locations, eq(inventoryItemQuants.locationId, locations.id))
      .leftJoin(inventoryItemLots, eq(inventoryItemQuants.lotId, inventoryItemLots.id))
      .where(
        and(
          eq(inventoryItemQuants.locationId, locationId),
          eq(inventoryItemQuants.inventoryItemId, inventoryItemId),
          gt(inventoryItemQuants.quantity, 0),
        ),
      )
      .orderBy(asc(inventoryItemQuants.createdAt));

    return rows.map((r) => ({
      quantId: r.quantId,
      lotNumber: r.lotNumber,
      expiryDate: r.expiryDate,
      quantity: Number(r.quantity ?? 0),
      reservedQuantity: Number(r.reservedQuantity ?? 0),
      unitCost: BigInt(r.unitCost as unknown as string),
      costCurrency: r.costCurrency,
      quantValue: BigInt(r.quantValue as unknown as string),
    }));
  }
}
