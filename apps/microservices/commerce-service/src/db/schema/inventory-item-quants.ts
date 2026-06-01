import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, check, decimal, index, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { costSourceTypeEnum } from './enums';
import { inventoryItemLots } from './inventory-item-lots';
import { inventoryItems } from './inventory-items';
import { locations } from './locations';
import { suppliers } from './suppliers';

export const inventoryItemQuants = coreSchema.table(
  'inventory_item_quants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    lotId: uuid('lot_id').references(() => inventoryItemLots.id, { onDelete: 'restrict' }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
    // Landed unit cost (BU minor units), set at creation and always > 0. Part of the cost-batch
    // identity: stock at the same (item, location, lot) but a different unit cost is a separate quant.
    unitCost: bigint('unit_cost', { mode: 'bigint' }).notNull(),
    // BU currency the unit cost is expressed in, captured when the quant is first created.
    costCurrency: varchar('cost_currency', { length: 3 }),
    // Polymorphic provenance: which document created this quant. No DB-level FK — the application
    // resolves the `source_type` enum to the right table.
    sourceType: costSourceTypeEnum('source_type'),
    sourceId: uuid('source_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_inventory_item_quants_item').on(table.inventoryItemId),
    index('idx_inventory_item_quants_location').on(table.locationId),
    index('idx_inventory_item_quants_item_location').on(table.inventoryItemId, table.locationId),
    index('idx_inventory_item_quants_item_location_lot').on(table.inventoryItemId, table.locationId, table.lotId),
    index('idx_inventory_item_quants_lot').on(table.lotId),
    index('idx_inventory_item_quants_supplier').on(table.supplierId),
    index('idx_inventory_item_quants_source').on(table.sourceType, table.sourceId),
    index('idx_inventory_item_quants_active')
      .on(table.inventoryItemId, table.locationId)
      .where(sql`${table.quantity} > 0`),
    check('ck_inventory_item_quants_unit_cost_positive', sql`${table.unitCost} > 0`),
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

export type InventoryItemQuant = typeof inventoryItemQuants.$inferSelect;
export type NewInventoryItemQuant = typeof inventoryItemQuants.$inferInsert;
