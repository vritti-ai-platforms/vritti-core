import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  alias,
  check,
  decimal,
  index,
  integer,
  QueryBuilder,
  timestamp,
  uniqueIndex,
  uuid,
} from '@vritti/api-sdk/drizzle-pg-core';
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

export type DisplayUnitRatios = {
  conversion: { primaryUomQty: number; uomQty: number } | null;
  displayUom: { symbol: string; baseUomQty: number; uomQty: number };
  primaryUom: { symbol: string; baseUomQty: number; uomQty: number };
};

// The stored figures that turn the inventory item read alongside into its display unit: its per-item conversion to that
// unit when it has one, and both units' ratios to their family's base unit; the arithmetic is the service's
export function displayUnitRatios() {
  const displayUom = alias(uom, 'display_uom');
  const primaryUom = alias(uom, 'primary_uom');
  return sql<DisplayUnitRatios>`(${new QueryBuilder()
    .select({
      ratios: sql`json_build_object(
        'conversion', CASE WHEN ${inventoryItemUomConversions.id} IS NULL THEN NULL ELSE json_build_object(
          'primaryUomQty', ${inventoryItemUomConversions.primaryUomQty},
          'uomQty', ${inventoryItemUomConversions.uomQty}) END,
        'displayUom', json_build_object(
          'symbol', ${displayUom.symbol}, 'baseUomQty', ${displayUom.baseUomQty}, 'uomQty', ${displayUom.uomQty}),
        'primaryUom', json_build_object(
          'symbol', ${primaryUom.symbol}, 'baseUomQty', ${primaryUom.baseUomQty}, 'uomQty', ${primaryUom.uomQty}))`,
    })
    .from(displayUom)
    .innerJoin(primaryUom, eq(primaryUom.id, inventoryItems.uomId))
    .leftJoin(
      inventoryItemUomConversions,
      and(
        eq(inventoryItemUomConversions.inventoryItemId, inventoryItems.id),
        eq(inventoryItemUomConversions.uomId, inventoryItems.displayUomId),
      ),
    )
    .where(eq(displayUom.id, inventoryItems.displayUomId))})`;
}
