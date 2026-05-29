import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, decimal, index, jsonb, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceiptLots } from './goods-receipt-lots';
import { inventoryItemQuants } from './inventory-item-quants';
import { locations } from './locations';

export const goodsReceiptLines = coreSchema.table(
  'goods_receipt_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    goodsReceiptItemId: uuid('goods_receipt_item_id')
      .notNull()
      .references(() => goodsReceiptItems.id, { onDelete: 'cascade' }),
    // null when the parent item.tracking = 'quantity'; required for 'lot' or 'serial'
    goodsReceiptLotId: uuid('goods_receipt_lot_id').references(() => goodsReceiptLots.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    // Snapshot of `quantity` converted to the inventory item's primary UOM at publish time. Computed
    // in the service via UomConversionsService (Decimal math); never derived in SQL. Cost-association
    // math reads this column so factor changes after publish don't retroactively shift the unit cost.
    // Matches the purchase_order_items pattern. NULL during PR1 transition for legacy rows + new
    // inserts from un-updated callers; Phase 3 (GR publish) always sets it. Tighten to NOT NULL in
    // a follow-up PR.
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }),
    resolvedQuantId: uuid('resolved_quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    isBalanced: boolean('is_balanced').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_goods_receipt_lines_item').on(table.goodsReceiptItemId),
    index('idx_goods_receipt_lines_lot').on(table.goodsReceiptLotId),
    index('idx_goods_receipt_lines_location').on(table.locationId),
    index('idx_goods_receipt_lines_resolved').on(table.resolvedQuantId),
    // Backstop for the service-layer duplicate-line guard. Two lines on the same
    // (item, lot, location) collapse into one logical receipt; allowing both produces confusing
    // UI and double-counted accepted quantities. NULLS NOT DISTINCT so lot=NULL collisions are
    // caught for tracking='quantity' and 'serial' items (PG 15+).
    unique('uq_goods_receipt_lines_item_lot_location')
      .on(table.goodsReceiptItemId, table.goodsReceiptLotId, table.locationId)
      .nullsNotDistinct(),
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

export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;
export type NewGoodsReceiptLine = typeof goodsReceiptLines.$inferInsert;
