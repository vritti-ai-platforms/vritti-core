import type { SelectFilterProps, SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { ComponentType } from 'react';
import type { SupplierInvoicePath } from '@/components/supplier-invoices/types';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import type {
  PurchaseOrderPermissions,
  UseAddPurchaseOrderItem,
  UseChangePurchaseOrderExchangeRate,
  UseChangePurchaseOrderSupplier,
  UseCompletePurchaseOrderDelivery,
  UseCreatePurchaseOrder,
  UseDeletePurchaseOrder,
  UseDownloadPurchaseOrderPdf,
  UsePurchaseOrder,
  UsePurchaseOrderGoodsReceiptsTable,
  UsePurchaseOrderInboundDeliveriesTable,
  UsePurchaseOrderItemDefaults,
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
  Selector: ComponentType<DistributiveOmit<SelectProps, 'optionsEndpoint'>>;
  Filter: ComponentType<DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string }>;
}

export interface PurchaseOrderInvoicesBinding {
  permission: string;
  Tab: ComponentType<{ purchaseOrder: PurchaseOrderDetail }>;
  invoicePath: SupplierInvoicePath;
}

export interface PurchaseOrdersBinding {
  permissions: PurchaseOrderPermissions;
  spansSites: boolean;
  suppliers: PurchaseOrderSuppliersBinding;
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
  useItemDefaults: UsePurchaseOrderItemDefaults;
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
  useCompleteDelivery: UseCompletePurchaseOrderDelivery;
  useDelete: UseDeletePurchaseOrder;
  useDownloadPdf: UseDownloadPurchaseOrderPdf;
}
