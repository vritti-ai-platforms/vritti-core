import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { purchaseSuppliers } from './purchase-suppliers';
import { purchases } from './purchases';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const purchaseEvents = commerceSchema.table(
  'purchase_events',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    purchaseSupplierId: uuid('purchase_supplier_id').references(() => purchaseSuppliers.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 50 }).notNull(),
    stepBefore: varchar('step_before', { length: 30 }),
    stepAfter: varchar('step_after', { length: 30 }),
    documentType: varchar('document_type', { length: 50 }),
    documentId: uuid('document_id'),
    reason: text('reason'),
    actorId: uuid('actor_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_purchase_events_purchase').on(table.purchaseId, table.createdAt),
    ...scopeFromOwnerPolicies({ owner: purchases, fk: table.purchaseId, ownerIs: 'siteDocument' }),
  ],
);

export type PurchaseEvent = typeof purchaseEvents.$inferSelect;
export type NewPurchaseEvent = typeof purchaseEvents.$inferInsert;
