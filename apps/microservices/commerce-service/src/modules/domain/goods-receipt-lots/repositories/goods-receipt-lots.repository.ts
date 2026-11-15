import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptLot, goodsReceiptLines, goodsReceiptLots } from '@/db/schema';

export type GoodsReceiptLotRow = GoodsReceiptLot & {
  linesCount: number;
  totalQuantity: number;
};

@Injectable()
export class GoodsReceiptLotsDomainRepository extends PrimaryBaseRepository<typeof goodsReceiptLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptLots);
  }

  // Returns the lots of a receipt item with how much of it their lines hold
  async findByItemId(itemId: string): Promise<GoodsReceiptLotRow[]> {
    return this.findAllWithSelect<GoodsReceiptLotRow>({
      select: this.selection(),
      where: eq(goodsReceiptLots.goodsReceiptItemId, itemId),
      orderBy: [asc(goodsReceiptLots.createdAt)],
    });
  }

  // Loads a lot of the given receipt item
  findOnItem(itemId: string, lotId: string): Promise<GoodsReceiptLotRow | undefined> {
    return this.findById<GoodsReceiptLotRow>(lotId, {
      select: this.selection(),
      where: eq(goodsReceiptLots.goodsReceiptItemId, itemId),
    });
  }

  // Whether another lot of the same receipt item already uses the lot number
  isLotNumberTaken(itemId: string, lotNumber: string, excludeLotId?: string): Promise<boolean> {
    return this.exists(
      and(
        eq(goodsReceiptLots.goodsReceiptItemId, itemId),
        eq(goodsReceiptLots.lotNumber, lotNumber),
        excludeLotId ? ne(goodsReceiptLots.id, excludeLotId) : undefined,
      ) as SQL,
    );
  }

  // Selects a lot with the number of lines it is distributed to and their total quantity
  private selection() {
    const ownLines = eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id);
    const totalQuantity = this.db
      .select({ total: sql`coalesce(sum(${goodsReceiptLines.quantity}), 0)` })
      .from(goodsReceiptLines)
      .where(ownLines);
    return {
      ...getColumns(goodsReceiptLots),
      linesCount: this.db.$count(goodsReceiptLines, ownLines),
      totalQuantity: sql<number>`(${totalQuantity})`.mapWith(Number),
    };
  }
}
