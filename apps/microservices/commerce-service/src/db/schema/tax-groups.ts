import { boolean, decimal, integer, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';

export const taxGroups = coreSchema.table(
  'tax_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    businessUnitId: uuid('business_unit_id').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
    hsnSacCode: varchar('hsn_sac_code', { length: 8 }),
    cgstRate: decimal('cgst_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    sgstRate: decimal('sgst_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    igstRate: decimal('igst_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    cessRate: decimal('cess_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('tax_groups_bu_name_unique').on(table.businessUnitId, table.name)],
);

export type TaxGroup = typeof taxGroups.$inferSelect;
export type NewTaxGroup = typeof taxGroups.$inferInsert;
