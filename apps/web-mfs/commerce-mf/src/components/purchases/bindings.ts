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
  UseCancelPurchaseLeg,
  UseChangePurchaseMinQuotations,
  UseChangePurchaseNotes,
  UseClosePurchase,
  UseClosePurchaseLeg,
  UseConfirmPurchaseLegPurchaseOrder,
  UseCreatePurchase,
  UseCreatePurchaseLegGoodsReceipt,
  UseCreatePurchaseLegInboundDelivery,
  UseCreatePurchaseLegPurchaseOrders,
  UseCreatePurchaseSupplierInvoice,
  UseCreateReceiveWithInvoice,
  UseDeletePurchase,
  UseDisablePurchaseQuotations,
  UseEnablePurchaseQuotations,
  UsePurchase,
  UsePurchaseAction,
  UsePurchaseActions,
  UsePurchaseCounts,
  UsePurchaseDocuments,
  UsePurchaseItem,
  UsePurchaseItemAllocationsTable,
  UsePurchaseItemComparison,
  UsePurchaseItemCounts,
  UsePurchaseItemDocumentsTable,
  UsePurchaseItemFacets,
  UsePurchaseItemProgress,
  UsePurchaseItemQuotesTable,
  UsePurchaseItemSiteStock,
  UsePurchaseItemsTable,
  UsePurchaseLegAction,
  UsePurchaseProgress,
  UsePurchaseQuotationsTable,
  UsePurchaseSupplier,
  UsePurchaseSupplierCounts,
  UsePurchaseSuppliersTable,
  UsePurchasesTable,
  UseReceiveWithInvoice,
  UseReceiveWithInvoiceAction,
  UseReceiveWithInvoiceOpenLines,
  UseRejectPurchaseLeg,
  UseRemovePurchaseAllocation,
  UseRemovePurchaseItem,
  UseRequestPurchaseQuotation,
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

export type PurchaseDetailTable = 'items' | 'comparison' | 'suppliers' | 'quotations';
export type PurchaseItemTable = 'allocations' | 'quotes' | 'documents';

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
  // The saved-state slug of one purchase's table, matching the gateway's: items, comparison, suppliers or quotations
  purchaseTableSlug: (id: string, table: PurchaseDetailTable) => string;
  // The query keys of one purchase's tables, refreshed when their saved state changes
  purchaseTableKeys: Record<PurchaseDetailTable, (id: string) => readonly unknown[]>;
  // The saved-state slug of one purchase item's table, matching the gateway's: allocations, quotes or documents
  purchaseItemTableSlug: (id: string, itemId: string, table: PurchaseItemTable) => string;
  // The query keys of one purchase item's tables, refreshed when their saved state changes
  purchaseItemTableKeys: Record<PurchaseItemTable, (id: string, itemId: string) => readonly unknown[]>;

  useTable: UsePurchasesTable;
  usePurchase: UsePurchase;
  usePurchaseCounts: UsePurchaseCounts;
  usePurchaseProgress: UsePurchaseProgress;
  usePurchaseActions: UsePurchaseActions;
  usePurchaseItemsTable: UsePurchaseItemsTable;
  usePurchaseItemFacets: UsePurchaseItemFacets;
  usePurchaseItem: UsePurchaseItem;
  usePurchaseItemCounts: UsePurchaseItemCounts;
  usePurchaseItemProgress: UsePurchaseItemProgress;
  usePurchaseItemSiteStock: UsePurchaseItemSiteStock;
  usePurchaseItemAllocationsTable: UsePurchaseItemAllocationsTable;
  usePurchaseItemQuotesTable: UsePurchaseItemQuotesTable;
  usePurchaseItemDocumentsTable: UsePurchaseItemDocumentsTable;
  usePurchaseItemComparison: UsePurchaseItemComparison;
  usePurchaseQuotationsTable: UsePurchaseQuotationsTable;
  usePurchaseSuppliersTable: UsePurchaseSuppliersTable;
  usePurchaseSupplier: UsePurchaseSupplier;
  usePurchaseSupplierCounts: UsePurchaseSupplierCounts;
  usePurchaseDocuments: UsePurchaseDocuments;

  useCreate: UseCreatePurchase;
  useChangeNotes: UseChangePurchaseNotes;
  useEnableQuotations: UseEnablePurchaseQuotations;
  useDisableQuotations: UseDisablePurchaseQuotations;
  useChangeMinQuotations: UseChangePurchaseMinQuotations;
  useClose: UseClosePurchase;
  useCancel: UseCancelPurchase;
  useDelete: UseDeletePurchase;

  useAddItem: UseAddPurchaseItem;
  useUpdateItem: UseUpdatePurchaseItem;
  useRemoveItem: UseRemovePurchaseItem;

  useRequestQuotation: UseRequestPurchaseQuotation;

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
  useCancelSupplier: UseCancelPurchaseLeg;
  useCreateSupplierInvoice: UseCreatePurchaseSupplierInvoice;
  receiveWithInvoices: ReceiveWithInvoicesBinding;
}
