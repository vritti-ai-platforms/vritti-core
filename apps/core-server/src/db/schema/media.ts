import { sql } from '@vritti/api-sdk/drizzle-orm';
import { bigint, index, jsonb, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { mediaStatusEnum } from './enums';
import { organizations } from './organizations';

export const media = coreSchema.table(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .default(sql.raw("cast(current_setting('app.org_id') as uuid)"))
      .references(() => organizations.id, { onDelete: 'cascade' }),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    checksum: varchar('checksum', { length: 128 }),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    bucket: varchar('bucket', { length: 255 }),
    provider: varchar('provider', { length: 50 }).notNull(),
    status: mediaStatusEnum('status').notNull().default('pending'),
    entityType: varchar('entity_type', { length: 255 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    uploadedBy: uuid('uploaded_by'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('media_organization_id_idx').on(table.organizationId),
    index('idx_media_entity').on(table.organizationId, table.entityType, table.entityId),
    index('idx_media_uploaded_by').on(table.uploadedBy),
    index('idx_media_status').on(table.status),
    // Dedup and reference-counting are per org, so both lookups lead with organization_id
    index('idx_media_checksum').on(table.organizationId, table.checksum),
    index('idx_media_storage_key').on(table.organizationId, table.storageKey),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
