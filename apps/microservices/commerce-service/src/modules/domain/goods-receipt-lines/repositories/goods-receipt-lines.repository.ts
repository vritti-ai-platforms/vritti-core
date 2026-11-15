import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, isNull, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptLine,
  goodsReceiptItems,
  goodsReceiptLineItems,
  goodsReceiptLines,
  goodsReceiptLots,
  inventoryItems,
  locations,
  uom,
} from '@/db/schema';

export type GoodsReceiptLineRow = GoodsReceiptLine & {
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  lotManufacturingDate: string | null;
  lotExpiryDate: string | null;
  lotMrp: bigint | null;
  primaryUomSymbol: string | null;
  lineItemsCount: number;
};

@Injectable()
export class GoodsReceiptLinesDomainRepository extends PrimaryBaseRepository<typeof goodsReceiptLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLines);
  }

  // Returns one page of a receipt item's lines, narrowed to one of its lots when given
  async findForTable(
    itemId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number; lotId?: string },
  ): Promise<{ result: GoodsReceiptLineRow[]; count: number }> {
    const { lotId, ...page } = options;
    return this.findAllAndCount<GoodsReceiptLineRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      ...page,
      where: and(
        eq(goodsReceiptLines.goodsReceiptItemId, itemId),
        lotId ? eq(goodsReceiptLines.goodsReceiptLotId, lotId) : undefined,
        page.where,
      ),
    });
  }

  // Returns every line of a receipt item with its location and lot
  async findByItemId(itemId: string): Promise<GoodsReceiptLineRow[]> {
    return this.findAllWithSelect<GoodsReceiptLineRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(goodsReceiptLines.goodsReceiptItemId, itemId),
      orderBy: [desc(goodsReceiptLines.createdAt)],
    });
  }

  // Loads a line of the given receipt item
  findOnItem(itemId: string, lineId: string): Promise<GoodsReceiptLineRow | undefined> {
    return this.findById<GoodsReceiptLineRow>(lineId, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(goodsReceiptLines.goodsReceiptItemId, itemId),
    });
  }

  // Whether the lot is one of the receipt item's lots
  async isLotOfItem(goodsReceiptLotId: string, itemId: string): Promise<boolean> {
    const [lot] = await this.db
      .select({ id: goodsReceiptLots.id })
      .from(goodsReceiptLots)
      .where(and(eq(goodsReceiptLots.id, goodsReceiptLotId), eq(goodsReceiptLots.goodsReceiptItemId, itemId)))
      .limit(1);
    return lot !== undefined;
  }

  // Sums the quantity the receipt item's lines already hold, leaving out one line when given
  async sumQuantityOfItem(itemId: string, excludeLineId?: string): Promise<string> {
    const [{ total }] = await this.db
      .select({ total: sql<string>`coalesce(sum(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(
        and(
          eq(goodsReceiptLines.goodsReceiptItemId, itemId),
          excludeLineId ? ne(goodsReceiptLines.id, excludeLineId) : undefined,
        ),
      );
    return total;
  }

  // Whether another line of the receipt item already holds the same lot at the same location
  isLocationTaken(
    itemId: string,
    line: { goodsReceiptLotId: string | null; locationId: string },
    excludeLineId?: string,
  ): Promise<boolean> {
    return this.exists(
      and(
        eq(goodsReceiptLines.goodsReceiptItemId, itemId),
        eq(goodsReceiptLines.locationId, line.locationId),
        line.goodsReceiptLotId === null
          ? isNull(goodsReceiptLines.goodsReceiptLotId)
          : eq(goodsReceiptLines.goodsReceiptLotId, line.goodsReceiptLotId),
        excludeLineId ? ne(goodsReceiptLines.id, excludeLineId) : undefined,
      ) as SQL,
    );
  }

  // Marks a line balanced exactly when its serial count matches its quantity
  async updateIsBalancedFromSerialCount(lineId: string): Promise<void> {
    const serialCount = this.db.$count(
      goodsReceiptLineItems,
      eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id),
    );
    await this.db
      .update(goodsReceiptLines)
      .set({ isBalanced: sql<boolean>`${goodsReceiptLines.quantity} = ${serialCount}` })
      .where(eq(goodsReceiptLines.id, lineId));
  }

  // Selects a line with its location, its lot and the item's primary unit
  private selection() {
    return {
      ...getColumns(goodsReceiptLines),
      locationName: locations.name,
      locationPath: locations.pathBreadcrumb,
      lotNumber: goodsReceiptLots.lotNumber,
      lotManufacturingDate: goodsReceiptLots.manufacturingDate,
      lotExpiryDate: goodsReceiptLots.expiryDate,
      lotMrp: goodsReceiptLots.mrp,
      primaryUomSymbol: uom.symbol,
      lineItemsCount: this.db.$count(
        goodsReceiptLineItems,
        eq(goodsReceiptLineItems.goodsReceiptLineId, goodsReceiptLines.id),
      ),
    };
  }

  // Joins the lot, the location, and the item's primary unit through the receipt item
  private joins() {
    return [
      { table: goodsReceiptLots, on: eq(goodsReceiptLots.id, goodsReceiptLines.goodsReceiptLotId) },
      { table: locations, on: eq(locations.id, goodsReceiptLines.locationId) },
      { table: goodsReceiptItems, on: eq(goodsReceiptItems.id, goodsReceiptLines.goodsReceiptItemId) },
      { table: inventoryItems, on: eq(inventoryItems.id, goodsReceiptItems.inventoryItemId) },
      { table: uom, on: eq(uom.id, inventoryItems.uomId) },
    ];
  }
}
