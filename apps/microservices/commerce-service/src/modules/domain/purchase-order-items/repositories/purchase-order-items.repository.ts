import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { aliasedTable, and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { categories, goodsReceiptItems, inventoryItems, type PurchaseOrderItem, purchaseOrderItems, uom } from '@/db/schema';

const orderUom = aliasedTable(uom, 'order_uom');

type EnrichedItem = PurchaseOrderItem & {
  inventoryItemName: string;
  orderUomSymbol: string | null;
  primaryUomSymbol: string | null;
};

@Injectable()
export class PurchaseOrderItemsRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
  }

  // Returns paginated PO line options for the GR AddItem selector when a PO is linked.
  // Identity is `purchase_order_items.id`; inventory item's name = label. Additionals carry the
  // resolved (inventoryItemId, uomId, unitPrice, currencyCode, allowDecimal, symbol,
  // orderedQuantity, receivedQuantity) so the dialog can post the GR add-item payload directly.
  // `orderedQuantity` is renamed from `uom_qty` via additionalExpressions; the rest resolve by
  // column-name match on owned / joined tables. Composes via super.findForSelect so the base's
  // pagination, additionalKeys handling, and bigint-string serialization apply.
  findForSelectByPo(
    poId: string,
    config: FindForSelectConfig,
    options?: { excludeOnGoodsReceiptId?: string },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [eq(purchaseOrderItems.purchaseOrderId, poId)];

    if (options?.excludeOnGoodsReceiptId) {
      const grId = options.excludeOnGoodsReceiptId;
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${goodsReceiptItems} gri
        WHERE gri.goods_receipt_id = ${grId}
          AND gri.inventory_item_id = ${purchaseOrderItems.inventoryItemId}
          AND gri.uom_id = ${purchaseOrderItems.uomId}
      )`);
    }

    return super.findForSelect({
      ...config,
      joins: [
        { table: inventoryItems, on: eq(inventoryItems.id, purchaseOrderItems.inventoryItemId), type: 'inner' },
        { table: categories, on: eq(categories.id, inventoryItems.categoryId), type: 'left' },
        { table: orderUom, on: eq(orderUom.id, purchaseOrderItems.uomId), type: 'left' },
      ],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
      additionalExpressions: {
        orderedQuantity: sql`${purchaseOrderItems.uomQty}`,
      },
    });
  }

  // Returns all line items for a PO with inventory item names, order UOM symbol, and primary UOM symbol
  async findItemsByPoId(poId: string): Promise<EnrichedItem[]> {
    const rows = await this.db
      .select({
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        uomQty: purchaseOrderItems.uomQty,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        primaryUomQty: purchaseOrderItems.primaryUomQty,
        primaryUomUnitPrice: purchaseOrderItems.primaryUomUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        currencyCode: purchaseOrderItems.currencyCode,
        inventoryItemName: inventoryItems.name,
        orderUomSymbol: orderUom.symbol,
        primaryUomSymbol: uom.symbol,
      })
      .from(purchaseOrderItems)
      .leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .leftJoin(orderUom, eq(purchaseOrderItems.uomId, orderUom.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows as EnrichedItem[];
  }

  // Returns inventory item IDs linked to a PO
  async findInventoryItemIdsByPoId(poId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: purchaseOrderItems.inventoryItemId })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows.map((row) => row.inventoryItemId);
  }

  // Returns paginated PO line items for table view
  async findItemsForTable(
    poId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: EnrichedItem[]; count: number }> {
    const baseWhere = eq(purchaseOrderItems.purchaseOrderId, poId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<EnrichedItem>({
      select: {
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        uomQty: purchaseOrderItems.uomQty,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        primaryUomQty: purchaseOrderItems.primaryUomQty,
        primaryUomUnitPrice: purchaseOrderItems.primaryUomUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        currencyCode: purchaseOrderItems.currencyCode,
        inventoryItemName: inventoryItems.name,
        orderUomSymbol: orderUom.symbol,
        primaryUomSymbol: uom.symbol,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(purchaseOrderItems.inventoryItemId, inventoryItems.id) },
        { table: orderUom, on: eq(purchaseOrderItems.uomId, orderUom.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Finds one PO line item by PO ID and item ID
  async findItemById(poId: string, itemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(and(eq(purchaseOrderItems.purchaseOrderId, poId), eq(purchaseOrderItems.id, itemId)));
    return (item as PurchaseOrderItem | undefined) ?? null;
  }

  // Finds one PO line item by PO ID, inventory item ID, and UOM.
  // Use for the dedup check on add/edit since uniqueness is the (po_id, item_id, uom_id) triple —
  // the same inventory item is allowed multiple times if the UOMs differ (e.g., 5 cartons + 12 pieces).
  async findItemByInventoryItemAndUom(
    poId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, poId),
          eq(purchaseOrderItems.inventoryItemId, inventoryItemId),
          eq(purchaseOrderItems.uomId, uomId),
        ),
      );
    return (item as PurchaseOrderItem | undefined) ?? null;
  }
}
