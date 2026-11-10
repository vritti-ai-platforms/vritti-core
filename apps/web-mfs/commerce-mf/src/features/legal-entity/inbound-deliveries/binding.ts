import { LE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import type { InboundDeliveriesBinding } from '@/components/inbound-deliveries/bindings';
import {
  INBOUND_DELIVERIES_TABLE_KEY,
  INBOUND_DELIVERY_LINES_TABLE_KEY,
  useInboundDeliveriesTable,
  useInboundDelivery,
  useInboundDeliveryLinesTable,
} from '@/hooks/legal-entity/inbound-deliveries';
import { SupplierFilter } from '@/selectors/supplier';

// The inbound deliveries of the legal entity's sites, read-only — each site announces and receives its own
export const binding: InboundDeliveriesBinding = {
  viewPermission: LE_INBOUND_DELIVERIES.view,
  spansSites: true,
  SupplierFilter,

  tableKey: INBOUND_DELIVERIES_TABLE_KEY,
  tableSlug: 'commerce-le-inbound-deliveries',
  linesTableKey: INBOUND_DELIVERY_LINES_TABLE_KEY,
  linesTableSlug: (id) => `commerce-le-inbound-delivery-${id}-lines`,

  useTable: useInboundDeliveriesTable,
  useInboundDelivery,
  useLinesTable: useInboundDeliveryLinesTable,
};
