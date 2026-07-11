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
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
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
    // Total cost laid into this quant (BU minor units). For GR-sourced quants it equals the sum of
    // this quant's inventory_item_quant_costs.allocated_amount rows exactly.
    quantCost: bigint('quant_cost', { mode: 'bigint' }).notNull().default(0n),
    // Remaining value (BU minor units). Starts == quant_cost; decremented on each outflow and set to
    // 0 on the final depletion to absorb the rounding residual.
    quantValue: bigint('quant_value', { mode: 'bigint' }).notNull().default(0n),
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

export type InventoryItemQuant = typeof inventoryItemQuants.$inferSelect;
export type NewInventoryItemQuant = typeof inventoryItemQuants.$inferInsert;
