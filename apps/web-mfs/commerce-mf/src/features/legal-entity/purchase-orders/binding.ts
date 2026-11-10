import { LE_GOODS_RECEIPTS } from '@vritti/commerce-permissions/goods-receipts';
import { LE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import type { PurchaseOrdersBinding } from '@/components/purchase-orders/bindings';
import {
  useCreateGoodsReceiptFromDelivery,
  useCreateGoodsReceiptFromPurchaseOrders,
} from '@/hooks/legal-entity/goods-receipts';
import {
  PURCHASE_ORDER_GOODS_RECEIPTS_TABLE_KEY,
  PURCHASE_ORDER_INBOUND_DELIVERIES_TABLE_KEY,
  PURCHASE_ORDER_ITEMS_TABLE_KEY,
  PURCHASE_ORDERS_TABLE_KEY,
  useAddPurchaseOrderItem,
  useChangePurchaseOrderExchangeRate,
  useChangePurchaseOrderSupplier,
  useClosePurchaseOrder,
  useCreatePurchaseOrder,
  useDeletePurchaseOrder,
  useDownloadPurchaseOrderPdf,
  usePurchaseOrder,
  usePurchaseOrderGoodsReceiptsTable,
  usePurchaseOrderInboundDeliveriesTable,
  usePurchaseOrderItemIds,
  usePurchaseOrderItemsTable,
  usePurchaseOrderProblems,
  usePurchaseOrdersTable,
  useRemovePurchaseOrderItem,
  useSendPurchaseOrderEmail,
  useSetPurchaseOrderConversionRate,
  useUpdatePurchaseOrderItem,
  useUpdatePurchaseOrderNotes,
  useUpdatePurchaseOrderStatus,
  useUpdatePurchaseOrderTaxDate,
} from '@/hooks/legal-entity/purchase-orders';
import { SupplierFilter, SupplierSelector } from '@/selectors/supplier';
import { invoicesBinding } from './invoicesBinding';
import { InvoicesTab } from './tabs/InvoicesTab';

// The purchase orders of the legal entity's sites, each raised for one of them; their invoices are entered from each order
export const binding: PurchaseOrdersBinding = {
  permissions: LE_PURCHASE_ORDERS,
  spansSites: true,
  suppliers: { Selector: SupplierSelector, Filter: SupplierFilter },
  goodsReceipts: {
    addPermission: LE_GOODS_RECEIPTS.add,
    useCreateFromDelivery: useCreateGoodsReceiptFromDelivery,
    useCreateFromPurchaseOrders: useCreateGoodsReceiptFromPurchaseOrders,
  },
  invoices: {
    permission: LE_PURCHASE_ORDERS.invoices.view,
    Tab: InvoicesTab,
    invoicePath: invoicesBinding.invoicePath,
  },

  tableKey: PURCHASE_ORDERS_TABLE_KEY,
  tableSlug: 'commerce-le-purchase-orders',
  itemsTableKey: PURCHASE_ORDER_ITEMS_TABLE_KEY,
  itemsTableSlug: (id) => `commerce-le-purchase-order-${id}-items`,
  goodsReceiptsTableKey: PURCHASE_ORDER_GOODS_RECEIPTS_TABLE_KEY,
  goodsReceiptsTableSlug: (id) => `commerce-le-purchase-order-${id}-goods-receipts`,
  inboundDeliveriesTableKey: PURCHASE_ORDER_INBOUND_DELIVERIES_TABLE_KEY,
  inboundDeliveriesTableSlug: (id) => `commerce-le-purchase-order-${id}-inbound-deliveries`,

  useTable: usePurchaseOrdersTable,
  usePurchaseOrder,
  useItemIds: usePurchaseOrderItemIds,
  useItemsTable: usePurchaseOrderItemsTable,
  useGoodsReceiptsTable: usePurchaseOrderGoodsReceiptsTable,
  useInboundDeliveriesTable: usePurchaseOrderInboundDeliveriesTable,
  useProblems: usePurchaseOrderProblems,

  useCreate: useCreatePurchaseOrder,
  useAddItem: useAddPurchaseOrderItem,
  useUpdateItem: useUpdatePurchaseOrderItem,
  useRemoveItem: useRemovePurchaseOrderItem,
  useUpdateNotes: useUpdatePurchaseOrderNotes,
  useChangeSupplier: useChangePurchaseOrderSupplier,
  useChangeExchangeRate: useChangePurchaseOrderExchangeRate,
  useSetConversionRate: useSetPurchaseOrderConversionRate,
  useUpdateStatus: useUpdatePurchaseOrderStatus,
  useUpdateTaxDate: useUpdatePurchaseOrderTaxDate,
  useSendEmail: useSendPurchaseOrderEmail,
  useClose: useClosePurchaseOrder,
  useDelete: useDeletePurchaseOrder,
  useDownloadPdf: useDownloadPurchaseOrderPdf,
};
