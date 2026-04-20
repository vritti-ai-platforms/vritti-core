import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  goodsReceiptNumberSeq,
  type GoodsReceiptItem,
  goodsReceiptItems,
  type NewGoodsReceipt,
  goodsReceipts,
  inventoryItems,
  type NewGoodsReceiptItem,
  purchaseOrderItems,
  purchaseOrders,
  suppliers,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptsRepository extends PrimaryBaseRepository<typeof goodsReceipts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceipts, { sequence: goodsReceiptNumberSeq });
  }

  // Generates a sequential goods receipt number
  async generateGrNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `GR-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Creates goods receipt header with auto-generated number
  async create(data: Omit<NewGoodsReceipt, 'grNumber'>): Promise<typeof goodsReceipts.$inferSelect> {
    const grNumber = await this.generateGrNumber();
    return super.create({ ...data, grNumber });
  }

  // Returns GR items for a goods receipt with inventory item names and batch fields
  async findItemsByGrId(grId: string): Promise<(GoodsReceiptItem & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        purchaseOrderItemId: goodsReceiptItems.purchaseOrderItemId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        acceptedQuantity: goodsReceiptItems.acceptedQuantity,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        rejectionReason: goodsReceiptItems.rejectionReason,
        batchNumber: goodsReceiptItems.batchNumber,
        manufacturingDate: goodsReceiptItems.manufacturingDate,
        expiryDate: goodsReceiptItems.expiryDate,
        inventoryItemName: inventoryItems.name,
      })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .where(eq(goodsReceiptItems.goodsReceiptId, grId));

    return rows as (GoodsReceiptItem & { inventoryItemName: string | null })[];
  }

  // Returns all GRs for a PO
  async findByPoId(poId: string) {
    return this.db.select().from(goodsReceipts).where(eq(goodsReceipts.purchaseOrderId, poId));
  }

  // Returns paginated goods receipts for table view
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (typeof goodsReceipts.$inferSelect & { supplierName: string | null; poNumber: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<typeof goodsReceipts.$inferSelect & { supplierName: string | null; poNumber: string | null }>({
      select: {
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        businessUnitId: goodsReceipts.businessUnitId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedBy: goodsReceipts.receivedBy,
        receivedDate: goodsReceipts.receivedDate,
        notes: goodsReceipts.notes,
        createdAt: goodsReceipts.createdAt,
        supplierName: suppliers.name,
        poNumber: purchaseOrders.poNumber,
      },
      leftJoins: [
        { table: suppliers, on: eq(goodsReceipts.supplierId, suppliers.id) },
        { table: purchaseOrders, on: eq(goodsReceipts.purchaseOrderId, purchaseOrders.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(goodsReceipts.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Creates GR line items with batch fields
  async createItems(items: NewGoodsReceiptItem[]): Promise<GoodsReceiptItem[]> {
    if (items.length === 0) return [];
    return this.db.insert(goodsReceiptItems).values(items).returning() as Promise<GoodsReceiptItem[]>;
  }

  // Updates PO item received quantity
  async updatePoItemReceivedQty(poItemId: string, addQty: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${String(addQty)}`,
      })
      .where(eq(purchaseOrderItems.id, poItemId));
  }

  // Returns PO item with quantities for receipt validation
  async findPoItemForReceipt(poItemId: string): Promise<{
    id: string;
    purchaseOrderId: string;
    inventoryItemId: string;
    orderedQuantity: string;
    receivedQuantity: string;
  } | null> {
    const result = await this.db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        orderedQuantity: purchaseOrderItems.orderedQuantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, poItemId));
    return result[0] ?? null;
  }

  // Finds supplier by ID
  async findSupplierById(id: string): Promise<typeof suppliers.$inferSelect | null> {
    const rows = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return rows[0] ?? null;
  }

  // Finds receipt by ID with supplier + PO references
  async findByIdWithRefs(
    id: string,
  ): Promise<(typeof goodsReceipts.$inferSelect & { supplierName: string | null; poNumber: string | null }) | null> {
    const rows = await this.db
      .select({
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        businessUnitId: goodsReceipts.businessUnitId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedBy: goodsReceipts.receivedBy,
        receivedDate: goodsReceipts.receivedDate,
        notes: goodsReceipts.notes,
        createdAt: goodsReceipts.createdAt,
        supplierName: suppliers.name,
        poNumber: purchaseOrders.poNumber,
      })
      .from(goodsReceipts)
      .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(goodsReceipts.purchaseOrderId, purchaseOrders.id))
      .where(eq(goodsReceipts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
}
