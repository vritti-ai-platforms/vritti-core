import { decimal, index, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryLedgerReferenceTypeEnum, inventoryLedgerTypeEnum } from './enums';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { inventoryItemBatches } from './inventory-item-batches';

export const inventoryLedger = coreSchema.table(
  'inventory_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').references(() => inventoryItemBatches.id, { onDelete: 'set null' }),
    type: inventoryLedgerTypeEnum('type').notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    referenceType: inventoryLedgerReferenceTypeEnum('reference_type'),
    referenceId: uuid('reference_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_inventory_ledger_item').on(table.inventoryItemId),
    index('idx_inventory_ledger_bu').on(table.businessUnitId),
    index('idx_inventory_ledger_ref').on(table.referenceType, table.referenceId),
    index('idx_inventory_ledger_created').on(table.inventoryItemId, table.createdAt),
    index('idx_inventory_ledger_batch').on(table.batchId),
  ],
);

export type InventoryLedgerEntry = typeof inventoryLedger.$inferSelect;
export type NewInventoryLedgerEntry = typeof inventoryLedger.$inferInsert;
