import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { SupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import {
  useAddSupplierInvoiceLine,
  useCreateSupplierInvoice,
  useInvoiceableGoodsReceipts,
  usePostSupplierInvoice,
  useReleaseSupplierInvoiceHold,
  useRemoveSupplierInvoiceLine,
  useUpdateSupplierInvoice,
  useUpdateSupplierInvoiceLine,
} from '@/hooks/site/supplier-invoices';
import { EnrolledSiteSupplierSelector } from '@/selectors/site-supplier';

// The supplier's invoices at the session site; the site enters, edits, posts and releases holds on them but never
// cancels or deletes
export const invoicesBinding: SupplierInvoicesBinding = {
  permissions: {
    view: SITE_SUPPLIERS.invoices.view,
    add: SITE_SUPPLIERS.invoices.add,
    edit: SITE_SUPPLIERS.invoices.edit,
  },
  spansSites: false,
  // The supplier route is `<supplier>`, so an invoice's page is `invoices/<number~id>` below it
  invoicePath: (invoice) => `invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  listPath: '../..',
  SupplierSelector: EnrolledSiteSupplierSelector,
  useCreateInvoice: useCreateSupplierInvoice,
  useUpdateInvoice: useUpdateSupplierInvoice,
  usePostInvoice: usePostSupplierInvoice,
  useInvoiceableGoodsReceipts,
  useAddLine: useAddSupplierInvoiceLine,
  useUpdateLine: useUpdateSupplierInvoiceLine,
  useRemoveLine: useRemoveSupplierInvoiceLine,
  useReleaseHold: useReleaseSupplierInvoiceHold,
};
