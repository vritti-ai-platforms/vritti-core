import type {
  SupplierInvoicePath,
  SupplierInvoicePermissions,
  SupplierInvoiceRemovalPermissions,
  UseAddInvoiceLine,
  UseCreateInvoice,
  UseInvoiceAction,
  UsePurchaseOrderInvoicesTable,
  UseRemoveInvoiceLine,
  UseUpdateInvoice,
  UseUpdateInvoiceLine,
} from './types';

export interface SupplierInvoicesListBinding {
  permissions: Pick<SupplierInvoicePermissions, 'view' | 'add'>;
  spansSites: boolean;
  invoicePath: SupplierInvoicePath;
  useCreateInvoice: UseCreateInvoice;
}

export interface SupplierInvoicesBinding extends SupplierInvoicesListBinding {
  permissions: SupplierInvoicePermissions;
  listPath: string;
  useUpdateInvoice: UseUpdateInvoice;
  usePostInvoice: UseInvoiceAction;
  useAddLine: UseAddInvoiceLine;
  useUpdateLine: UseUpdateInvoiceLine;
  useRemoveLine: UseRemoveInvoiceLine;
  removal?: SupplierInvoiceRemovalBinding;
}

export interface PurchaseOrderSupplierInvoicesBinding extends SupplierInvoicesListBinding {
  tableKey: (purchaseOrderId: string) => readonly unknown[];
  tableSlug: (purchaseOrderId: string) => string;
  useTable: UsePurchaseOrderInvoicesTable;
}

export interface SupplierInvoiceRemovalBinding {
  permissions: SupplierInvoiceRemovalPermissions;
  useCancelInvoice: UseInvoiceAction;
  useDeleteInvoice: UseInvoiceAction;
}
