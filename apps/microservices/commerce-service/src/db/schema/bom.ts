import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  decimal,
  index,
  pgPolicy,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';

export const bom = coreSchema.table(
  'bom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('uq_bom_bu_code').on(table.businessUnitId, table.code),
    index('idx_bom_bu').on(table.organizationId, table.businessUnitId),
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

export type Bom = typeof bom.$inferSelect;
export type NewBom = typeof bom.$inferInsert;

export const bomLines = coreSchema.table(
  'bom_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    bomId: uuid('bom_id')
      .notNull()
      .references(() => bom.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    requiredQuantity: decimal('required_quantity', { precision: 12, scale: 3 }).notNull(),
  },
  (table) => [
    unique('uq_bom_lines_bom_item').on(table.bomId, table.inventoryItemId),
    index('idx_bom_lines_bom').on(table.bomId),
  ],
);

export type BomLine = typeof bomLines.$inferSelect;
export type NewBomLine = typeof bomLines.$inferInsert;
