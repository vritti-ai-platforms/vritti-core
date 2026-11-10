import type { SelectFilterProps, SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { ComponentType } from 'react';
import type {
  UseCreateGoodsReceiptFromDelivery,
  UseCreateGoodsReceiptFromPurchaseOrders,
} from '@/components/goods-receipts/types';
import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import type {
  PurchaseOrderPermissions,
  UseAddPurchaseOrderItem,
  UseChangePurchaseOrderExchangeRate,
  UseChangePurchaseOrderSupplier,
  UseClosePurchaseOrder,
  UseCreatePurchaseOrder,
  UseDeletePurchaseOrder,
  UseDownloadPurchaseOrderPdf,
  UsePurchaseOrder,
  UsePurchaseOrderGoodsReceiptsTable,
  UsePurchaseOrderInboundDeliveriesTable,
  UsePurchaseOrderItemIds,
  UsePurchaseOrderItemsTable,
  UsePurchaseOrderProblems,
  UsePurchaseOrdersTable,
  UseRemovePurchaseOrderItem,
  UseSendPurchaseOrderEmail,
  UseSetPurchaseOrderConversionRate,
  UseUpdatePurchaseOrderItem,
  UseUpdatePurchaseOrderNotes,
  UseUpdatePurchaseOrderStatus,
  UseUpdatePurchaseOrderTaxDate,
} from './types';

export interface PurchaseOrderSuppliersBinding {
  Selector: ComponentType<Omit<SelectProps, 'optionsEndpoint'>>;
  Filter: ComponentType<DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string }>;
}

export interface PurchaseOrderGoodsReceiptsBinding {
  addPermission: string;
  useCreateFromDelivery: UseCreateGoodsReceiptFromDelivery;
  useCreateFromPurchaseOrders: UseCreateGoodsReceiptFromPurchaseOrders;
}

export interface PurchaseOrderInvoicesBinding {
  permission: string;
  Tab: ComponentType<{ purchaseOrderId: string }>;
  invoicePath: SupplierInvoicePath;
}

export interface PurchaseOrdersBinding {
  permissions: PurchaseOrderPermissions;
  spansSites: boolean;
  suppliers: PurchaseOrderSuppliersBinding;
  goodsReceipts: PurchaseOrderGoodsReceiptsBinding;
  invoices?: PurchaseOrderInvoicesBinding;

  tableKey: readonly unknown[];
  tableSlug: string;
  itemsTableKey: (id: string) => readonly unknown[];
  itemsTableSlug: (id: string) => string;
  goodsReceiptsTableKey: (id: string) => readonly unknown[];
  goodsReceiptsTableSlug: (id: string) => string;
  inboundDeliveriesTableKey: (id: string) => readonly unknown[];
  inboundDeliveriesTableSlug: (id: string) => string;

  useTable: UsePurchaseOrdersTable;
  usePurchaseOrder: UsePurchaseOrder;
  useItemIds: UsePurchaseOrderItemIds;
  useItemsTable: UsePurchaseOrderItemsTable;
  useGoodsReceiptsTable: UsePurchaseOrderGoodsReceiptsTable;
  useInboundDeliveriesTable: UsePurchaseOrderInboundDeliveriesTable;
  useProblems: UsePurchaseOrderProblems;

  useCreate: UseCreatePurchaseOrder;
  useAddItem: UseAddPurchaseOrderItem;
  useUpdateItem: UseUpdatePurchaseOrderItem;
  useRemoveItem: UseRemovePurchaseOrderItem;
  useUpdateNotes: UseUpdatePurchaseOrderNotes;
  useChangeSupplier: UseChangePurchaseOrderSupplier;
  useChangeExchangeRate: UseChangePurchaseOrderExchangeRate;
  useSetConversionRate: UseSetPurchaseOrderConversionRate;
  useUpdateStatus: UseUpdatePurchaseOrderStatus;
  useUpdateTaxDate: UseUpdatePurchaseOrderTaxDate;
  useSendEmail: UseSendPurchaseOrderEmail;
  useClose: UseClosePurchaseOrder;
  useDelete: UseDeletePurchaseOrder;
  useDownloadPdf: UseDownloadPurchaseOrderPdf;
}
