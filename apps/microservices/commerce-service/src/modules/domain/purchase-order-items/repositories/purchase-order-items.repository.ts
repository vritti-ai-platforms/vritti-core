import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { aliasedTable, and, asc, desc, eq, ilike, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
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
  // Identity is `purchase_order_items.id`; the inventory item's name is the display label and the
  // additionals carry the resolved (inventoryItemId, uomId, unitPrice, currencyCode, allowDecimal,
  // symbol) so the dialog can post the GR add-item payload directly without a supplier-items hop.
  // When excludeOnGoodsReceiptId is supplied, hides PO lines whose (inventoryItemId, uomId) is
  // already on that GR.
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

    const limit = Number(config.limit) || 20;
    const offset = Number(config.offset) || 0;
    const search = config.search?.trim();
    if (search) {
      conditions.push(ilike(inventoryItems.name, `%${search}%`));
    }

    return this.db
      .select({
        value: purchaseOrderItems.id,
        label: inventoryItems.name,
        groupId: inventoryItems.categoryId,
        groupName: categories.name,
        symbol: orderUom.symbol,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        uomId: purchaseOrderItems.uomId,
        unitPrice: purchaseOrderItems.unitPrice,
        currencyCode: purchaseOrderItems.currencyCode,
        allowDecimal: orderUom.allowDecimal,
        orderedQuantity: purchaseOrderItems.uomQty,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(purchaseOrderItems)
      .innerJoin(inventoryItems, eq(inventoryItems.id, purchaseOrderItems.inventoryItemId))
      .leftJoin(categories, eq(categories.id, inventoryItems.categoryId))
      .leftJoin(orderUom, eq(orderUom.id, purchaseOrderItems.uomId))
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(categories.id), asc(inventoryItems.name))
      .limit(limit)
      .offset(offset)
      .then((rows) => {
        const seenGroups = new Map<string, string>();
        for (const row of rows) {
          if (row.groupId != null && row.groupName != null && !seenGroups.has(row.groupId)) {
            seenGroups.set(row.groupId, row.groupName);
          }
        }
        return {
          options: rows.map((row) => ({
            value: row.value,
            label: row.label,
            ...(row.groupId != null ? { groupId: row.groupId } : {}),
            additionals: {
              symbol: row.symbol,
              inventoryItemId: row.inventoryItemId,
              uomId: row.uomId,
              // bigint → string to dodge JSON's 2^53 precision ceiling. orderedQuantity/receivedQuantity
              // are decimal(12,3) so they fit safely in a JS number; only unitPrice is bigint money.
              unitPrice: row.unitPrice.toString(),
              currencyCode: row.currencyCode,
              allowDecimal: row.allowDecimal,
              orderedQuantity: Number(row.orderedQuantity),
              receivedQuantity: Number(row.receivedQuantity),
            },
          })),
          groups: Array.from(seenGroups.entries()).map(([id, name]) => ({ id, name })),
          hasMore: false,
        };
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

  // Finds the first PO line item for a given inventory item, ignoring UOM.
  // Use for "is this item on the PO at all" checks (e.g., GR validation).
  async findItemByInventoryItemId(poId: string, inventoryItemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(
        and(eq(purchaseOrderItems.purchaseOrderId, poId), eq(purchaseOrderItems.inventoryItemId, inventoryItemId)),
      );
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

  // Updates pricing fields for a PO line item
  async updateLinePricing(itemId: string, data: { unitPrice: bigint; totalPrice: bigint }): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
      })
      .where(eq(purchaseOrderItems.id, itemId));
  }
}
