import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import type {
  PurchasePermissions,
  PurchaseQuotationPath,
  PurchaseSupplierFilter,
  PurchaseSupplierSelector,
  UseAddPurchaseAllocation,
  UseAddPurchaseAllocationsFromQuotation,
  UseAddPurchaseItem,
  UseCancelPurchase,
  UseClosePurchaseLeg,
  UseConfirmPurchaseLegPurchaseOrder,
  UseCreatePurchase,
  UseCreatePurchaseLegGoodsReceipt,
  UseCreatePurchaseLegInboundDelivery,
  UseCreatePurchaseLegPurchaseOrders,
  UseCreatePurchaseSupplierInvoice,
  UseCreateReceiveWithInvoice,
  UseDeletePurchase,
  UsePurchase,
  UsePurchaseAction,
  UsePurchaseItems,
  UsePurchaseLegAction,
  UsePurchaseQuotations,
  UsePurchaseSourcingItems,
  UsePurchaseSuppliers,
  UsePurchasesTable,
  UseReceiveWithInvoice,
  UseReceiveWithInvoiceAction,
  UseReceiveWithInvoiceOpenLines,
  UseRejectPurchaseLeg,
  UseRemovePurchaseAllocation,
  UseRemovePurchaseItem,
  UseRequestPurchaseQuotation,
  UseUpdatePurchase,
  UseUpdatePurchaseAllocation,
  UseUpdatePurchaseItem,
  UseUpdateReceiveWithInvoice,
} from './types';

// How a purchase's quotations are reached: the legal entity prices and posts them in its Quotations feature, a site
// only sees them once posted
export interface PurchaseQuotationsBinding {
  draftLabel: string;
  quotationPath?: PurchaseQuotationPath;
}

// A supplier invoice entered once with the goods it brings: its open allocations and the draft until it is posted
export interface ReceiveWithInvoicesBinding {
  useOpenLines: UseReceiveWithInvoiceOpenLines;
  useReceiveWithInvoice: UseReceiveWithInvoice;
  useCreate: UseCreateReceiveWithInvoice;
  useUpdate: UseUpdateReceiveWithInvoice;
  usePost: UseReceiveWithInvoiceAction;
  useDiscard: UseReceiveWithInvoiceAction;
}

export interface PurchasesBinding {
  permissions: PurchasePermissions;
  // The legal entity lists every site's purchases, narrowed by the context bar's site filter, and picks a site per purchase
  spansSites: boolean;
  SupplierSelector: PurchaseSupplierSelector;
  // Narrows the supplier picker to the suppliers enrolled at the purchase's site where the session has no site
  supplierParams?: (siteId: string) => Record<string, string>;
  SupplierFilter: PurchaseSupplierFilter;
  quotations: PurchaseQuotationsBinding;
  // Where an invoice opens, from the workspace root: under its supplier at a site, in Supplier Invoices at the LE
  invoicePath: SupplierInvoicePath;
  mrpEditPermission: string;
  // Narrows a location picker to the invoice's site where the session has no site
  locationParams?: (siteId: string) => Record<string, string>;

  tableKey: readonly unknown[];
  tableSlug: string;

  useTable: UsePurchasesTable;
  usePurchase: UsePurchase;
  usePurchaseItems: UsePurchaseItems;
  usePurchaseQuotations: UsePurchaseQuotations;
  usePurchaseSourcingItems: UsePurchaseSourcingItems;
  usePurchaseSuppliers: UsePurchaseSuppliers;

  useCreate: UseCreatePurchase;
  useUpdate: UseUpdatePurchase;
  useCancel: UseCancelPurchase;
  useDelete: UseDeletePurchase;

  useAddItem: UseAddPurchaseItem;
  useUpdateItem: UseUpdatePurchaseItem;
  useRemoveItem: UseRemovePurchaseItem;
  useSubmitItems: UsePurchaseAction;

  useRequestQuotation: UseRequestPurchaseQuotation;
  useCompleteQuotations: UsePurchaseAction;

  useAddAllocation: UseAddPurchaseAllocation;
  useAddAllocationsFromQuotation: UseAddPurchaseAllocationsFromQuotation;
  useUpdateAllocation: UseUpdatePurchaseAllocation;
  useRemoveAllocation: UseRemovePurchaseAllocation;
  useSubmit: UsePurchaseAction;

  useSubmitLeg: UsePurchaseLegAction;
  useApproveLeg: UsePurchaseLegAction;
  useRejectLeg: UseRejectPurchaseLeg;

  useCreateLegPurchaseOrders: UseCreatePurchaseLegPurchaseOrders;
  useConfirmLegPurchaseOrder: UseConfirmPurchaseLegPurchaseOrder;
  useCreateLegInboundDelivery: UseCreatePurchaseLegInboundDelivery;
  useCreateLegGoodsReceipt: UseCreatePurchaseLegGoodsReceipt;
  useCloseSupplier: UseClosePurchaseLeg;
  useCreateSupplierInvoice: UseCreatePurchaseSupplierInvoice;
  receiveWithInvoices: ReceiveWithInvoicesBinding;
}
