import { decimal, index, pgPolicy, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { conversionStatusEnum } from './enums';
import { coreSchema } from './core-schema';
import { bom } from './bom';
import { inventoryItems } from './inventory-items';

export const conversions = coreSchema.table(
  'conversions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    bomId: uuid('bom_id').references(() => bom.id),
    status: conversionStatusEnum('status').notNull().default('DRAFT'),
    producedBy: uuid('produced_by'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_conversions_bu').on(table.organizationId, table.businessUnitId),
    index('idx_conversions_bom').on(table.bomId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
  ],
);

export type Conversion = typeof conversions.$inferSelect;
export type NewConversion = typeof conversions.$inferInsert;

export const conversionInputs = coreSchema.table(
  'conversion_inputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    conversionId: uuid('conversion_id').notNull().references(() => conversions.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    wastageQuantity: decimal('wastage_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  },
  (table) => [
    index('idx_conversion_inputs_conversion').on(table.conversionId),
    index('idx_conversion_inputs_item').on(table.inventoryItemId),
  ],
);

export type ConversionInput = typeof conversionInputs.$inferSelect;
export type NewConversionInput = typeof conversionInputs.$inferInsert;

export const conversionOutputs = coreSchema.table(
  'conversion_outputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    conversionId: uuid('conversion_id').notNull().references(() => conversions.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    wastageQuantity: decimal('wastage_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  },
  (table) => [
    index('idx_conversion_outputs_conversion').on(table.conversionId),
    index('idx_conversion_outputs_item').on(table.inventoryItemId),
  ],
);

export type ConversionOutput = typeof conversionOutputs.$inferSelect;
export type NewConversionOutput = typeof conversionOutputs.$inferInsert;
