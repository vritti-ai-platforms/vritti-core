import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  check,
  date,
  decimal,
  index,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseItemSourceEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { purchases } from './purchases';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const purchaseItems = commerceSchema.table(
  'purchase_items',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    primaryQty: decimal('primary_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    source: purchaseItemSourceEnum('source').notNull().default('MANUAL'),
    sourceId: uuid('source_id'),
    neededBy: date('needed_by', { mode: 'string' }),
    notes: text('notes'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_purchase_items_purchase_item').on(table.purchaseId, table.inventoryItemId),
    uniqueIndex('uq_purchase_items_source').on(table.source, table.sourceId).where(sql`${table.sourceId} IS NOT NULL`),
    index('idx_purchase_items_inventory_item').on(table.inventoryItemId),
    check('purchase_items_primary_qty_chk', sql`${table.primaryQty} > 0`),
    ...scopeFromOwnerPolicies({ owner: purchases, fk: table.purchaseId, ownerIs: 'siteDocument' }),
  ],
);

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
