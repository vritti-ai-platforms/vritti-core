import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  decimal,
  index,
  jsonb,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { goodsReceipts } from './goods-receipts';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const goodsReceiptItems = commerceSchema.table(
  'goods_receipt_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
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
    // Paid quantity in the item's UOM. Capped by the PO line's remaining quantity when PO-linked; the
    // anchor that reconciles against the PO (free qty is bonus on top, not counted against the PO).
    orderedQty: decimal('ordered_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    // Free-goods scheme prefilled from the PO/supplier item, editable on the GR. `free_qty` is derived
    // from `ordered_qty` via the scheme; `total_qty = ordered_qty + free_qty`.
    schemeBuyQty: decimal('scheme_buy_qty', { precision: 12, scale: 3, mode: 'number' }),
    schemeFreeQty: decimal('scheme_free_qty', { precision: 12, scale: 3, mode: 'number' }),
    hasScheme: boolean('has_scheme').notNull().default(false),
    freeQty: decimal('free_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    // Total received quantity = ordered_qty + free_qty, in the item's UOM. The item is balanced once
    // its lines distribute exactly this much (SUM(lines.quantity) == total_qty).
    totalQty: decimal('total_qty', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    rejectedQuantity: decimal('rejected_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    // Supplier price captured at the breakdown step. Pre-filled from PO when GR is linked, else
    // from supplier_items, then editable. Used by autoAssociateSupplierPrice at publish so this
    // works for un-linked GRs too. NULLABLE during transition; tighten to NOT NULL in a follow-up
    // once every code path populates it.
    unitPrice: bigint('unit_price', { mode: 'bigint' }),
    // Snapshot of `unit_price` converted to the inventory item's primary UOM, computed at create/
    // update time via UomConversionsDomainService (Decimal precise). Cost-association math reads this
    // directly so factor changes after publish don't retroactively shift the per-quant cost.
    primaryUomUnitPrice: bigint('primary_uom_unit_price', { mode: 'bigint' }),
    // Effective landed cost per unit after the free-goods scheme, in the item's UOM and supplier
    // currency: unit_price × ordered_qty / total_qty. Diluted by free units, so unit_cost × total_qty
    // equals the amount paid. Recomputed on every price/quantity/scheme change.
    unitCost: bigint('unit_cost', { mode: 'bigint' }),
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
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;
