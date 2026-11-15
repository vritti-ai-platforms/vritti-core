import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, decimal, index, integer, timestamp, uniqueIndex, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { uom } from './uom';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const inventoryItemUomConversions = commerceSchema.table(
  'inventory_item_uom_conversions',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id, { onDelete: 'restrict' }),
    primaryUomQty: integer('primary_uom_qty').notNull(),
    uomQty: integer('uom_qty').notNull(),
    weight: decimal('weight', { precision: 12, scale: 3, mode: 'number' }),
    volume: decimal('volume', { precision: 12, scale: 3, mode: 'number' }),
    length: decimal('length', { precision: 12, scale: 3, mode: 'number' }),
    width: decimal('width', { precision: 12, scale: 3, mode: 'number' }),
    height: decimal('height', { precision: 12, scale: 3, mode: 'number' }),
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
    check(
      'inventory_item_uom_conversions_measures_chk',
      sql`(${table.weight} IS NULL OR ${table.weight} > 0)
        AND (${table.volume} IS NULL OR ${table.volume} > 0)
        AND (${table.length} IS NULL OR ${table.length} > 0)
        AND (${table.width} IS NULL OR ${table.width} > 0)
        AND (${table.height} IS NULL OR ${table.height} > 0)`,
    ),
    orgIsolationPolicy(),
  ],
);

export type InventoryItemUomConversion = typeof inventoryItemUomConversions.$inferSelect;
export type NewInventoryItemUomConversion = typeof inventoryItemUomConversions.$inferInsert;
