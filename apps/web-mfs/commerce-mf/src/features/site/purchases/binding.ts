import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { PurchasesBinding } from '@/components/purchases/bindings';
import {
  PURCHASES_TABLE_KEY,
  useAddPurchaseAllocation,
  useAddPurchaseAllocationsFromQuotation,
  useAddPurchaseItem,
  useApprovePurchaseLeg,
  useCancelPurchase,
  useClosePurchaseLeg,
  useCompletePurchaseQuotations,
  useConfirmPurchaseLegPurchaseOrder,
  useCreatePurchase,
  useCreatePurchaseLegGoodsReceipt,
  useCreatePurchaseLegInboundDelivery,
  useCreatePurchaseLegPurchaseOrders,
  useCreatePurchaseSupplierInvoice,
  useCreateReceiveWithInvoice,
  useDeletePurchase,
  useDiscardReceiveWithInvoice,
  usePostReceiveWithInvoice,
  usePurchase,
  usePurchaseItems,
  usePurchaseQuotations,
  usePurchaseSourcingItems,
  usePurchaseSuppliers,
  usePurchasesTable,
  useReceiveWithInvoice,
  useReceiveWithInvoiceOpenLines,
  useRejectPurchaseLeg,
  useRemovePurchaseAllocation,
  useRemovePurchaseItem,
  useRequestPurchaseQuotation,
  useSubmitPurchase,
  useSubmitPurchaseItems,
  useSubmitPurchaseLeg,
  useUpdatePurchase,
  useUpdatePurchaseAllocation,
  useUpdatePurchaseItem,
  useUpdateReceiveWithInvoice,
} from '@/hooks/site/purchases';
import { EnrolledSiteSupplierSelector, SiteSupplierFilter } from '@/selectors/site-supplier';

// The session site's purchases, sourced from the suppliers enrolled at it; its quotations are priced and posted by the
// legal entity, so a draft only waits here
export const binding: PurchasesBinding = {
  permissions: SITE_PURCHASES,
  spansSites: false,
  SupplierSelector: EnrolledSiteSupplierSelector,
  SupplierFilter: SiteSupplierFilter,
  quotations: { draftLabel: 'Waiting for the legal entity' },
  // A site's invoices live under their supplier
  invoicePath: (invoice) =>
    `suppliers/${buildSlug(invoice.supplierName, invoice.supplierId)}/invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  mrpEditPermission: SITE_INVENTORY_ITEMS.mrp.edit,

  tableKey: PURCHASES_TABLE_KEY,
  tableSlug: 'commerce-site-purchases',

  useTable: usePurchasesTable,
  usePurchase,
  usePurchaseItems,
  usePurchaseQuotations,
  usePurchaseSourcingItems,
  usePurchaseSuppliers,

  useCreate: useCreatePurchase,
  useUpdate: useUpdatePurchase,
  useCancel: useCancelPurchase,
  useDelete: useDeletePurchase,

  useAddItem: useAddPurchaseItem,
  useUpdateItem: useUpdatePurchaseItem,
  useRemoveItem: useRemovePurchaseItem,
  useSubmitItems: useSubmitPurchaseItems,

  useRequestQuotation: useRequestPurchaseQuotation,
  useCompleteQuotations: useCompletePurchaseQuotations,

  useAddAllocation: useAddPurchaseAllocation,
  useAddAllocationsFromQuotation: useAddPurchaseAllocationsFromQuotation,
  useUpdateAllocation: useUpdatePurchaseAllocation,
  useRemoveAllocation: useRemovePurchaseAllocation,
  useSubmit: useSubmitPurchase,

  useSubmitLeg: useSubmitPurchaseLeg,
  useApproveLeg: useApprovePurchaseLeg,
  useRejectLeg: useRejectPurchaseLeg,

  useCreateLegPurchaseOrders: useCreatePurchaseLegPurchaseOrders,
  useConfirmLegPurchaseOrder: useConfirmPurchaseLegPurchaseOrder,
  useCreateLegInboundDelivery: useCreatePurchaseLegInboundDelivery,
  useCreateLegGoodsReceipt: useCreatePurchaseLegGoodsReceipt,
  useCloseSupplier: useClosePurchaseLeg,
  useCreateSupplierInvoice: useCreatePurchaseSupplierInvoice,
  receiveWithInvoices: {
    useOpenLines: useReceiveWithInvoiceOpenLines,
    useReceiveWithInvoice,
    useCreate: useCreateReceiveWithInvoice,
    useUpdate: useUpdateReceiveWithInvoice,
    usePost: usePostReceiveWithInvoice,
    useDiscard: useDiscardReceiveWithInvoice,
  },
};
