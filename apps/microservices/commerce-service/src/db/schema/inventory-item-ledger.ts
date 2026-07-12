import { sql } from '@vritti/api-sdk/drizzle-orm';
import { decimal, index, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemLedgerReferenceTypeEnum, inventoryItemLedgerTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';

export const inventoryItemLedger = coreSchema.table(
  'inventory_item_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    type: inventoryItemLedgerTypeEnum('type').notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    referenceType: inventoryItemLedgerReferenceTypeEnum('reference_type'),
    referenceId: uuid('reference_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_inventory_item_ledger_item').on(table.inventoryItemId),
    index('idx_inventory_item_ledger_site').on(table.siteId),
    index('idx_inventory_item_ledger_ref').on(table.referenceType, table.referenceId),
    index('idx_inventory_item_ledger_created').on(table.inventoryItemId, table.createdAt),
  ],
);

export type InventoryItemLedgerEntry = typeof inventoryItemLedger.$inferSelect;
export type NewInventoryItemLedgerEntry = typeof inventoryItemLedger.$inferInsert;
