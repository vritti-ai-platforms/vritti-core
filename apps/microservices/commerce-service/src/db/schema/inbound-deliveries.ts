import { sql } from '@vritti/api-sdk/drizzle-orm';
import { check, date, decimal, index, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { commerceSchema } from './commerce-schema';
import { inboundDeliverySourceEnum, inboundDeliveryStatusEnum } from './enums';
import { purchaseOrderItems } from './purchase-orders';
import { suppliers } from './suppliers';
import { LE_GUC, organizationIdColumn, scopeFromOwnerPolicies, siteDocumentPolicies } from './workspace-scope';

export const inboundDeliveries = commerceSchema.table(
  'inbound_deliveries',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    legalEntityId: uuid('legal_entity_id').notNull().default(sql.raw(LE_GUC)),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    deliveryNumber: varchar('delivery_number', { length: 50 }).notNull(),
    status: inboundDeliveryStatusEnum('status').notNull().default('PLANNED'),
    source: inboundDeliverySourceEnum('source').notNull().default('ANNOUNCED'),
    expectedDeliveryDate: date('expected_delivery_date', { mode: 'string' }).notNull(),
    carrier: varchar('carrier', { length: 100 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    supplierDeliveryNoteNumber: varchar('supplier_delivery_note_number', { length: 100 }),
    supplierDeliveryNoteDate: date('supplier_delivery_note_date', { mode: 'string' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inbound_deliveries_org_delivery_number').on(table.organizationId, table.deliveryNumber),
    index('idx_inbound_deliveries_site').on(table.organizationId, table.siteId),
    index('idx_inbound_deliveries_supplier').on(table.supplierId),
    index('idx_inbound_deliveries_supplier_note').on(table.supplierId, table.supplierDeliveryNoteNumber),
    ...siteDocumentPolicies(),
  ],
);

export type InboundDelivery = typeof inboundDeliveries.$inferSelect;
export type NewInboundDelivery = typeof inboundDeliveries.$inferInsert;

export const inboundDeliveryLines = commerceSchema.table(
  'inbound_delivery_lines',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn,
    inboundDeliveryId: uuid('inbound_delivery_id')
      .notNull()
      .references(() => inboundDeliveries.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: uuid('purchase_order_item_id')
      .notNull()
      .references(() => purchaseOrderItems.id),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inbound_delivery_lines_delivery_po_item').on(table.inboundDeliveryId, table.purchaseOrderItemId),
    index('idx_inbound_delivery_lines_po_item').on(table.purchaseOrderItemId),
    check('inbound_delivery_lines_quantity_chk', sql`${table.quantity} > 0`),
    ...scopeFromOwnerPolicies({ owner: inboundDeliveries, fk: table.inboundDeliveryId, ownerIs: 'siteDocument' }),
  ],
);

export type InboundDeliveryLine = typeof inboundDeliveryLines.$inferSelect;
export type NewInboundDeliveryLine = typeof inboundDeliveryLines.$inferInsert;
