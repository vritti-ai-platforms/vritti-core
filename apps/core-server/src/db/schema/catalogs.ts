import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, jsonb, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import type { CatalogLicense, SignedDocument } from '@vritti/api-sdk/license';
import { coreSchema } from './core-schema';

export const catalogs = coreSchema.table(
  'catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    version: varchar('version', { length: 50 }).notNull(),
    hash: varchar('hash', { length: 64 }).notNull(),
    // Whole signed document is stored so the license can be re-verified on every load
    license: jsonb('license').$type<SignedDocument<CatalogLicense>>().notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    activatedAt: timestamp('activated_at'),
  },
  (table) => [
    uniqueIndex('catalogs_hash_unique').on(table.hash),
    // At most one active catalog row at a time
    uniqueIndex('catalogs_active_unique').on(table.isActive).where(sql`${table.isActive}`),
  ],
);

export type Catalog = typeof catalogs.$inferSelect;
export type NewCatalog = typeof catalogs.$inferInsert;
