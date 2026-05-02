import { bigint, index, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { invoiceTypeEnum, invoicePartyTypeEnum, invoiceStatusEnum } from './enums';

export const invoices = coreSchema.table(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    type: invoiceTypeEnum('type').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    partyType: invoicePartyTypeEnum('party_type').notNull(),
    partyId: uuid('party_id'),
    partyName: varchar('party_name', { length: 255 }).notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
    taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
    paidAmount: bigint('paid_amount', { mode: 'number' }).notNull().default(0),
    balance: bigint('balance', { mode: 'number' }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('DRAFT'),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    issuedDate: timestamp('issued_date', { withTimezone: true, mode: 'string' }),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_invoices_bu_number').on(table.businessUnitId, table.invoiceNumber),
    index('idx_invoices_bu').on(table.organizationId, table.businessUnitId),
    index('idx_invoices_party').on(table.partyType, table.partyId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
