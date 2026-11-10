import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { FindForSelectConfig, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  goodsReceiptItems,
  goodsReceipts,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrderItems,
  purchaseOrders,
} from '@/db/schema';
import { remainingToDeliver } from './delivery-quantities';

export type ReceivablePurchaseOrder = Pick<
  PurchaseOrder,
  'id' | 'poNumber' | 'status' | 'supplierId' | 'siteId' | 'legalEntityId' | 'timezone'
> & { isOnGoodsReceipt: boolean };

@Injectable()
export class ReceivablePurchaseOrdersRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  private static readonly RECEIVABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.CONFIRMED,
    PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  ];

  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders);
  }

  // Returns the supplier's confirmed or partially received POs with a line left to receive outside open deliveries; with a receipt, only those of its site not already on it
  findForSelectReceivable(
    supplierId: string,
    config: FindForSelectConfig,
    goodsReceiptId?: string,
  ): Promise<SelectQueryResult> {
    const openLine = this.db
      .select({ id: purchaseOrderItems.id })
      .from(purchaseOrderItems)
      .where(and(eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id), sql`${remainingToDeliver(this.db)} > 0`));
    const conditions: SQL[] = [
      eq(purchaseOrders.supplierId, supplierId),
      inArray(purchaseOrders.status, ReceivablePurchaseOrdersRepository.RECEIVABLE_STATUSES),
      exists(openLine),
    ];
    if (goodsReceiptId) {
      const receiptSite = this.db
        .select({ siteId: goodsReceipts.siteId })
        .from(goodsReceipts)
        .where(eq(goodsReceipts.id, goodsReceiptId));
      conditions.push(sql`${purchaseOrders.siteId} = (${receiptSite})`, notExists(this.receiptItemsOf(goodsReceiptId)));
    }

    return super.findForSelect({
      ...config,
      conditions,
      additionalExpressions: {
        status: sql`${purchaseOrders.status}`,
        orderDate: sql`${purchaseOrders.orderDate}`,
      },
    });
  }

  // Loads POs to receive from the supplier, rejecting any that is missing, of another supplier, not confirmed or partially received, or at another site than the others or the given one
  async findReceivableOrThrow(
    supplierId: string,
    purchaseOrderIds: string[],
    target: { siteId?: string; goodsReceiptId?: string } = {},
  ): Promise<ReceivablePurchaseOrder[]> {
    const rows = await this.db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        supplierId: purchaseOrders.supplierId,
        siteId: purchaseOrders.siteId,
        legalEntityId: purchaseOrders.legalEntityId,
        timezone: purchaseOrders.timezone,
        isOnGoodsReceipt: target.goodsReceiptId
          ? sql<boolean>`${exists(this.receiptItemsOf(target.goodsReceiptId))}`
          : sql<boolean>`false`,
      })
      .from(purchaseOrders)
      .where(inArray(purchaseOrders.id, purchaseOrderIds));
    const field = target.goodsReceiptId ? 'purchaseOrderId' : 'purchaseOrderIds';

    if (rows.length < new Set(purchaseOrderIds).size) {
      throw new NotFoundException({
        label: 'Purchase Order Not Found',
        detail: 'One of the purchase orders no longer exists or is out of reach.',
        errors: [{ field, message: 'Unknown purchase order' }],
      });
    }
    const otherSupplier = rows.find((row) => row.supplierId !== supplierId);
    if (otherSupplier) {
      throw new BadRequestException({
        label: 'Different Supplier',
        detail: `"${otherSupplier.poNumber}" is ordered from another supplier; a goods receipt receives the orders of one supplier.`,
        errors: [{ field, message: 'Another supplier' }],
      });
    }
    const notOpen = rows.find((row) => !ReceivablePurchaseOrdersRepository.RECEIVABLE_STATUSES.includes(row.status));
    if (notOpen) {
      throw new BadRequestException({
        label: 'Purchase Order Not Open',
        detail: `"${notOpen.poNumber}" is ${notOpen.status}; goods can be received only against a confirmed or partially received order.`,
        errors: [{ field, message: `Order is ${notOpen.status}` }],
      });
    }
    const siteIds = new Set([...rows.map((row) => row.siteId), ...(target.siteId ? [target.siteId] : [])]);
    if (siteIds.size > 1) {
      throw new BadRequestException({
        label: 'Different Site',
        detail: 'Every purchase order on a goods receipt must be for the site the goods arrive at.',
        errors: [{ field, message: 'Another site' }],
      });
    }
    const onReceipt = rows.find((row) => row.isOnGoodsReceipt);
    if (onReceipt) {
      throw new BadRequestException({
        label: 'Already on Receipt',
        detail: `"${onReceipt.poNumber}" is already on this goods receipt. Edit its lines instead.`,
        errors: [{ field, message: 'Already on this receipt' }],
      });
    }
    return rows;
  }

  // Selects the items of a receipt that count a line of the outer query's PO
  private receiptItemsOf(goodsReceiptId: string) {
    return this.db
      .select({ id: goodsReceiptItems.id })
      .from(goodsReceiptItems)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id),
        ),
      );
  }
}
