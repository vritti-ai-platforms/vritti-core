import { LE_SUPPLIER_INVOICES } from '@vritti/commerce-permissions/supplier-invoices';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { SupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import {
  useAddSupplierInvoiceLine,
  useCancelSupplierInvoice,
  useCreateSupplierInvoice,
  useDeleteSupplierInvoice,
  useInvoiceableGoodsReceipts,
  usePostSupplierInvoice,
  useReleaseSupplierInvoiceHold,
  useRemoveSupplierInvoiceLine,
  useSupplierInvoiceCounts,
  useUpdateSupplierInvoice,
  useUpdateSupplierInvoiceLine,
} from '@/hooks/legal-entity/supplier-invoices';
import { SupplierSelector } from '@/selectors/supplier';

// The invoices of every site of the legal entity, which also cancels invoices and deletes drafts
export const binding: SupplierInvoicesBinding = {
  permissions: {
    view: LE_SUPPLIER_INVOICES.view,
    add: LE_SUPPLIER_INVOICES.add,
    edit: LE_SUPPLIER_INVOICES.edit,
  },
  spansSites: true,
  invoicePath: (invoice) => buildSlug(invoice.invoiceNumber, invoice.id),
  listPath: '..',
  SupplierSelector,
  useCreateInvoice: useCreateSupplierInvoice,
  useSupplierInvoiceCounts,
  useUpdateInvoice: useUpdateSupplierInvoice,
  usePostInvoice: usePostSupplierInvoice,
  useInvoiceableGoodsReceipts,
  useAddLine: useAddSupplierInvoiceLine,
  useUpdateLine: useUpdateSupplierInvoiceLine,
  useRemoveLine: useRemoveSupplierInvoiceLine,
  useReleaseHold: useReleaseSupplierInvoiceHold,
  removal: {
    permissions: { cancel: LE_SUPPLIER_INVOICES.edit, delete: LE_SUPPLIER_INVOICES.delete },
    useCancelInvoice: useCancelSupplierInvoice,
    useDeleteInvoice: useDeleteSupplierInvoice,
  },
};
