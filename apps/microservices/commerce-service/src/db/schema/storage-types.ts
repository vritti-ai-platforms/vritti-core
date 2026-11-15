import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  check,
  codeCheck,
  decimal,
  index,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { StorageCapacityCheckValues, storageCapacityCheckEnum } from './enums';
import { organizationIdColumn, orgIsolationPolicy } from './workspace-scope';

export const storageTypes = commerceSchema.table(
  'storage_types',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    maxWeight: decimal('max_weight', { precision: 12, scale: 3, mode: 'number' }),
    maxVolume: decimal('max_volume', { precision: 12, scale: 3, mode: 'number' }),
    length: decimal('length', { precision: 12, scale: 3, mode: 'number' }),
    width: decimal('width', { precision: 12, scale: 3, mode: 'number' }),
    height: decimal('height', { precision: 12, scale: 3, mode: 'number' }),
    capacityCheck: storageCapacityCheckEnum('capacity_check').notNull().default(StorageCapacityCheckValues.BLOCK),
    allowMixedItems: boolean('allow_mixed_items').notNull().default(true),
    allowMixedBatches: boolean('allow_mixed_batches').notNull().default(false),
    allowAdditionToStock: boolean('allow_addition_to_stock').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_storage_types_org_code').on(table.organizationId, table.code),
    codeCheck('storage_types_code_chk', table.code),
    check(
      'storage_types_measures_chk',
      sql`(${table.maxWeight} IS NULL OR ${table.maxWeight} > 0)
        AND (${table.maxVolume} IS NULL OR ${table.maxVolume} > 0)
        AND (${table.length} IS NULL OR ${table.length} > 0)
        AND (${table.width} IS NULL OR ${table.width} > 0)
        AND (${table.height} IS NULL OR ${table.height} > 0)`,
    ),
    index('idx_storage_types_org').on(table.organizationId),
    orgIsolationPolicy(),
  ],
);

export type StorageType = typeof storageTypes.$inferSelect;
export type NewStorageType = typeof storageTypes.$inferInsert;
