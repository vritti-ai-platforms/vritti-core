import { SITE_GOODS_RECEIPTS } from '@vritti/commerce-permissions/goods-receipts';
import { SITE_INBOUND_DELIVERIES } from '@vritti/commerce-permissions/inbound-deliveries';
import type { InboundDeliveriesBinding } from '@/components/inbound-deliveries/bindings';
import {
  INBOUND_DELIVERIES_TABLE_KEY,
  INBOUND_DELIVERY_LINES_TABLE_KEY,
  useAddInboundDeliveryLines,
  useCreateInboundDelivery,
  useDeleteInboundDelivery,
  useInboundDeliveriesTable,
  useInboundDelivery,
  useInboundDeliveryLinesTable,
  useRemoveInboundDeliveryLine,
  useUpdateInboundDelivery,
  useUpdateInboundDeliveryLine,
  useUpdateInboundDeliveryStatus,
} from '@/hooks/site/inbound-deliveries';
import { EnrolledSiteSupplierSelector, SiteSupplierFilter } from '@/selectors/site-supplier';

// The session site's inbound deliveries: created and moved along here, and received in its goods receipts
export const binding: InboundDeliveriesBinding = {
  viewPermission: SITE_INBOUND_DELIVERIES.view,
  receivePermission: SITE_GOODS_RECEIPTS.add,
  spansSites: false,
  SupplierFilter: SiteSupplierFilter,

  tableKey: INBOUND_DELIVERIES_TABLE_KEY,
  tableSlug: 'commerce-site-inbound-deliveries',
  linesTableKey: INBOUND_DELIVERY_LINES_TABLE_KEY,
  linesTableSlug: (id) => `commerce-site-inbound-delivery-${id}-lines`,

  useTable: useInboundDeliveriesTable,
  useInboundDelivery,
  useLinesTable: useInboundDeliveryLinesTable,

  mutations: {
    permissions: SITE_INBOUND_DELIVERIES,
    SupplierSelector: EnrolledSiteSupplierSelector,

    useCreate: useCreateInboundDelivery,
    useUpdate: useUpdateInboundDelivery,
    useUpdateStatus: useUpdateInboundDeliveryStatus,
    useDelete: useDeleteInboundDelivery,
    useAddLines: useAddInboundDeliveryLines,
    useUpdateLine: useUpdateInboundDeliveryLine,
    useRemoveLine: useRemoveInboundDeliveryLine,
  },
};
