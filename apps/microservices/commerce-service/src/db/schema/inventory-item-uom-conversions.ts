import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, index, integer, pgPolicy, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';

export const inventoryItemUomConversions = commerceSchema.table(
  'inventory_item_uom_conversions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    // Integer pair expressing the conversion ratio for this (item, uom) override.
    // Semantic: `uom_qty` units of THIS UOM equal `primary_uom_qty` units of the item's primary UOM.
    // Example: 1 Strip = 14 Each → primary_uom_qty=14, uom_qty=1.
    // The two conversion factors (toPrimary = primary_uom_qty / uom_qty; toUom = uom_qty / primary_uom_qty)
    // are computed in the service layer; they are NOT stored.
    primaryUomQty: integer('primary_uom_qty').notNull(),
    uomQty: integer('uom_qty').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_iiuc_item_uom').on(table.inventoryItemId, table.uomId),
    index('idx_iiuc_item').on(table.inventoryItemId),
    check('chk_iiuc_primary_uom_qty_positive', sql`${table.primaryUomQty} > 0`),
    check('chk_iiuc_uom_qty_positive', sql`${table.uomQty} > 0`),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItemUomConversion = typeof inventoryItemUomConversions.$inferSelect;
export type NewInventoryItemUomConversion = typeof inventoryItemUomConversions.$inferInsert;
