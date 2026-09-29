import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { parties } from './parties';
import { LE_GUC, organizationIdColumn, workspaceScopeColumns, workspaceScopePolicies } from './workspace-scope';

export const carts = commerceSchema.table(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    ...workspaceScopeColumns,
    // Declared here rather than by calling .notNull() on the shared builder: drizzle mutates builders
    // in place, so that would make legal_entity_id NOT NULL on every table that spreads them.
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw(LE_GUC)),
    partyId: uuid('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    checkoutStartedAt: timestamp('checkout_started_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_carts_party_workspace')
      .on(table.organizationId, table.legalEntityId, table.siteId, table.partyId)
      .nullsNotDistinct(),
    index('idx_carts_party').on(table.organizationId, table.legalEntityId, table.siteId, table.partyId),
    index('idx_carts_abandoned').on(table.updatedAt),
    ...workspaceScopePolicies('cart_reach'),
  ],
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
