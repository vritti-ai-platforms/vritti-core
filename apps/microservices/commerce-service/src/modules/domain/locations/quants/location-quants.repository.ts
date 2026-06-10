import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, gt, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemLots,
  inventoryItemQuants,
  inventoryItems,
  locations,
  uom,
} from '@/db/schema';

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

@Injectable()
export class LocationQuantsRepository extends PrimaryBaseRepository<typeof inventoryItemQuants> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemQuants);
  }

  // Groups a location's non-zero quants by inventory item: SUM(quantity), SUM(reserved),
  // SUM(quant_value), COUNT(*) as batchCount, joined to item name/code and uom symbol. Applies
  // optional FilterProcessor where/orderBy for item-name search/sort plus pagination, and returns
  // the distinct-item count for the table total.
  async findItemsForLocation(
    locationId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: LocationItemRow[]; count: number }> {
    const baseWhere = and(eq(inventoryItemQuants.locationId, locationId), gt(inventoryItemQuants.quantity, 0));
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    const having = sql`SUM(${inventoryItemQuants.quantity}) > 0`;
    const orderBy = options.orderBy?.length ? options.orderBy : [asc(inventoryItems.name)];

    const result = await this.db
      .select({
        inventoryItemId: inventoryItemQuants.inventoryItemId,
        itemName: inventoryItems.name,
        itemCode: inventoryItems.code,
        uomSymbol: uom.symbol,
        totalQuantity: sql<number>`SUM(${inventoryItemQuants.quantity})`,
        reservedQuantity: sql<number>`SUM(${inventoryItemQuants.reservedQuantity})`,
        totalValueMinor: sql<string>`SUM(${inventoryItemQuants.quantValue})`,
        costCurrency: sql<string | null>`MAX(${inventoryItemQuants.costCurrency})`,
        batchCount: sql<number>`COUNT(*)`,
      })
      .from(inventoryItemQuants)
      .innerJoin(inventoryItems, eq(inventoryItemQuants.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .where(where)
      .groupBy(inventoryItemQuants.inventoryItemId, inventoryItems.name, inventoryItems.code, uom.symbol)
      .having(having)
      .orderBy(...orderBy)
      .limit(options.limit)
      .offset(options.offset);

    const countRows = await this.db
      .select({ itemId: inventoryItemQuants.inventoryItemId })
      .from(inventoryItemQuants)
      .innerJoin(inventoryItems, eq(inventoryItemQuants.inventoryItemId, inventoryItems.id))
      .where(where)
      .groupBy(inventoryItemQuants.inventoryItemId)
      .having(having);

    return {
      result: result.map((r) => ({
        inventoryItemId: r.inventoryItemId,
        itemName: r.itemName,
        itemCode: r.itemCode,
        uomSymbol: r.uomSymbol,
        totalQuantity: Number(r.totalQuantity ?? 0),
        reservedQuantity: Number(r.reservedQuantity ?? 0),
        totalValueMinor: BigInt(r.totalValueMinor ?? '0'),
        costCurrency: r.costCurrency,
        batchCount: Number(r.batchCount ?? 0),
      })),
      count: countRows.length,
    };
  }

  // Per-quant breakdown for a single (location, item): non-zero quants joined to locations + lots,
  // selecting quantity, reservedQuantity, unit cost, cost currency, quant value, lot number, and
  // expiry date. Ordered by creation for a stable, FIFO-ish display.
  async findBreakdown(locationId: string, inventoryItemId: string): Promise<LocationItemQuantRow[]> {
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
