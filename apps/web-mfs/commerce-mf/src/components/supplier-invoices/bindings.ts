import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import type {
  SupplierInvoicePath,
  SupplierInvoicePermissions,
  SupplierInvoiceRemovalPermissions,
  SupplierSelectorComponent,
  UseAddInvoiceLine,
  UseCreateInvoice,
  UseInvoiceAction,
  UseInvoiceableGoodsReceipts,
  UsePurchaseOrderInvoicesTable,
  UseReleaseInvoiceHold,
  UseRemoveInvoiceLine,
  UseUpdateInvoice,
  UseUpdateInvoiceLine,
} from './types';

export interface SupplierInvoicesListBinding {
  permissions: Pick<SupplierInvoicePermissions, 'view' | 'add'>;
  spansSites: boolean;
  invoicePath: SupplierInvoicePath;
}

export interface SupplierInvoiceCreateBinding {
  permissions: Pick<SupplierInvoicePermissions, 'add'>;
  spansSites: boolean;
  invoicePath: SupplierInvoicePath;
  SupplierSelector: SupplierSelectorComponent;
  useCreateInvoice: UseCreateInvoice;
}

export interface SupplierInvoicesBinding extends SupplierInvoicesListBinding, SupplierInvoiceCreateBinding {
  permissions: SupplierInvoicePermissions;
  listPath: string;
  useUpdateInvoice: UseUpdateInvoice;
  usePostInvoice: UseInvoiceAction;
  useInvoiceableGoodsReceipts: UseInvoiceableGoodsReceipts;
  useAddLine: UseAddInvoiceLine;
  useUpdateLine: UseUpdateInvoiceLine;
  useRemoveLine: UseRemoveInvoiceLine;
  useReleaseHold: UseReleaseInvoiceHold;
  removal?: SupplierInvoiceRemovalBinding;
}

export interface PurchaseOrderSupplierInvoicesBinding extends SupplierInvoicesListBinding {
  newInvoicePath: (purchaseOrder: Pick<PurchaseOrderDetail, 'supplierId' | 'supplierName' | 'siteId'>) => string;
  tableKey: (purchaseOrderId: string) => readonly unknown[];
  tableSlug: (purchaseOrderId: string) => string;
  useTable: UsePurchaseOrderInvoicesTable;
}

export interface SupplierInvoiceRemovalBinding {
  permissions: SupplierInvoiceRemovalPermissions;
  useCancelInvoice: UseInvoiceAction;
  useDeleteInvoice: UseInvoiceAction;
}
