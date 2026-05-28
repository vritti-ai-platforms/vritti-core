import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, decimal, index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceipts } from './goods-receipts';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const goodsReceiptItems = coreSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    goodsReceiptId: uuid('goods_receipt_id')
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    // Snapshot of the supplier-item UOM picked at add time. Part of the natural key together with
    // (goodsReceiptId, inventoryItemId), so the same product can appear multiple times under
    // different UOMs (e.g. 5 cases + 12 loose pieces). Mirrors purchase_order_items's keying.
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    // Supplier price captured at the breakdown step. Pre-filled from PO when GR is linked, else
    // from supplier_items, then editable. Used by autoAssociateSupplierPrice at publish so this
    // works for un-linked GRs too. NULLABLE during transition; tighten to NOT NULL in a follow-up
    // once every code path populates it.
    unitPrice: bigint('unit_price', { mode: 'bigint' }),
    // Snapshot of `unit_price` converted to the inventory item's primary UOM, computed at create/
    // update time via UomConversionsService (Decimal precise). Cost-association math reads this
    // directly so factor changes after publish don't retroactively shift the per-quant cost.
    primaryUomUnitPrice: bigint('primary_uom_unit_price', { mode: 'bigint' }),
    currencyCode: varchar('currency_code', { length: 3 }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_goods_receipt_items_gr_item_uom').on(table.goodsReceiptId, table.inventoryItemId, table.uomId),
    index('idx_goods_receipt_items_receipt').on(table.goodsReceiptId),
    index('idx_goods_receipt_items_inventory').on(table.inventoryItemId),
    index('idx_goods_receipt_items_uom').on(table.uomId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
