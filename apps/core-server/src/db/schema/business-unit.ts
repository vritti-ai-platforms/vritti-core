import { boolean, customType, index, integer, jsonb, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { buTypeEnum } from './enums';
import { organizations } from './organizations';

const ltreeType = customType<{ data: string }>({
  dataType() {
    return 'vritti_core.ltree';
  },
});

export interface BuMetadata {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  lat?: number;
  lng?: number;
  phone?: string;
}

export const businessUnits = coreSchema.table(
  'business_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    type: buTypeEnum('type').notNull(),
    depth: integer('depth').notNull().default(0),
    path: ltreeType('path').notNull(),
    appOverrides: jsonb('app_overrides').$type<Record<string, Record<string, unknown>>>(),
    inheritConfig: boolean('inherit_config').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    appCodes: jsonb('app_codes').$type<string[]>().notNull().default([]),
    metadata: jsonb('metadata').$type<BuMetadata>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('business_units_organization_id_idx').on(table.organizationId),
    index('business_units_parent_id_idx').on(table.parentId),
  ],
);

export type BusinessUnit = typeof businessUnits.$inferSelect;
export type NewBusinessUnit = typeof businessUnits.$inferInsert;
