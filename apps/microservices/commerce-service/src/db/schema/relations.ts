import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  categories: {
    inventoryItems: r.many.inventoryItems(),
  },
  items: {
    itemFieldValues: r.many.itemFieldValues(),
    orderItems: r.many.orderItems(),
  },
  itemOptions: {},
  itemOptionValues: {},
  itemVariants: {
    bom: r.one.bom({
      from: r.itemVariants.bomId,
      to: r.bom.id,
    }),
    orderItems: r.many.orderItems(),
  },
  itemVariantOptionValues: {},
  modifierGroups: {},
  modifierOptions: {},
  itemModifierGroups: {},
  taxGroups: {
    taxRates: r.many.taxRates(),
  },
  taxRates: {
    taxGroup: r.one.taxGroups({
      from: r.taxRates.taxGroupId,
      to: r.taxGroups.id,
    }),
  },
  itemFieldDefinitions: {
    itemFieldValues: r.many.itemFieldValues(),
  },
  itemFieldValues: {
    item: r.one.items({
      from: r.itemFieldValues.itemId,
      to: r.items.id,
    }),
    fieldDefinition: r.one.itemFieldDefinitions({
      from: r.itemFieldValues.fieldDefinitionId,
      to: r.itemFieldDefinitions.id,
    }),
  },
  uom: {
    inventoryItems: r.many.inventoryItems(),
    supplierItems: r.many.supplierItems(),
  },
  inventoryItems: {
    category: r.one.categories({
      from: r.inventoryItems.categoryId,
      to: r.categories.id,
    }),
    uom: r.one.uom({
      from: r.inventoryItems.uomId,
      to: r.uom.id,
    }),
    bomLines: r.many.bomLines(),
    conversionInputs: r.many.conversionInputs(),
    conversionOutputs: r.many.conversionOutputs(),
    supplierItems: r.many.supplierItems(),
    purchaseOrderItems: r.many.purchaseOrderItems(),
    goodsReceiptItems: r.many.goodsReceiptItems(),
    goodsReceiptBatches: r.many.goodsReceiptBatches(),
    inventoryItemBatches: r.many.inventoryItemBatches(),
    inventoryItemBatchItems: r.many.inventoryItemBatchItems(),
    inventoryLedger: r.many.inventoryLedger(),
    stockAdjustments: r.many.stockAdjustments(),
    stockTransfers: r.many.stockTransfers(),
    storageLocationConfigs: r.many.storageLocationConfigs(),
  },
  storageLocations: {
    inventoryItemBatches: r.many.inventoryItemBatches(),
    storageLocationConfigs: r.many.storageLocationConfigs(),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
    goodsReceiptBatches: r.many.goodsReceiptBatches(),
  },
  inventoryItemBatches: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemBatches.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    location: r.one.storageLocations({
      from: r.inventoryItemBatches.locationId,
      to: r.storageLocations.id,
    }),
    goodsReceiptItem: r.one.goodsReceiptItems({
      from: r.inventoryItemBatches.goodsReceiptItemId,
      to: r.goodsReceiptItems.id,
    }),
    inventoryLedger: r.many.inventoryLedger(),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
    inventoryItemBatchItems: r.many.inventoryItemBatchItems(),
  },
  inventoryLevels: {},
  inventoryLedger: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryLedger.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    batch: r.one.inventoryItemBatches({
      from: r.inventoryLedger.batchId,
      to: r.inventoryItemBatches.id,
    }),
  },
  bom: {
    bomLines: r.many.bomLines(),
    conversions: r.many.conversions(),
    itemVariants: r.many.itemVariants(),
  },
  bomLines: {
    bom: r.one.bom({
      from: r.bomLines.bomId,
      to: r.bom.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.bomLines.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  suppliers: {
    supplierContacts: r.many.supplierContacts(),
    supplierItems: r.many.supplierItems(),
    purchaseOrders: r.many.purchaseOrders(),
    goodsReceipts: r.many.goodsReceipts(),
  },
  supplierContacts: {
    supplier: r.one.suppliers({
      from: r.supplierContacts.supplierId,
      to: r.suppliers.id,
    }),
  },
  supplierItems: {
    supplier: r.one.suppliers({
      from: r.supplierItems.supplierId,
      to: r.suppliers.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.supplierItems.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    uom: r.one.uom({
      from: r.supplierItems.uomId,
      to: r.uom.id,
    }),
  },
  purchaseOrders: {
    supplier: r.one.suppliers({
      from: r.purchaseOrders.supplierId,
      to: r.suppliers.id,
    }),
    purchaseOrderItems: r.many.purchaseOrderItems(),
    goodsReceipts: r.many.goodsReceipts(),
  },
  purchaseOrderItems: {
    purchaseOrder: r.one.purchaseOrders({
      from: r.purchaseOrderItems.purchaseOrderId,
      to: r.purchaseOrders.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.purchaseOrderItems.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  goodsReceipts: {
    supplier: r.one.suppliers({
      from: r.goodsReceipts.supplierId,
      to: r.suppliers.id,
    }),
    purchaseOrder: r.one.purchaseOrders({
      from: r.goodsReceipts.purchaseOrderId,
      to: r.purchaseOrders.id,
    }),
    goodsReceiptItems: r.many.goodsReceiptItems(),
  },
  goodsReceiptBatches: {
    goodsReceiptItem: r.one.goodsReceiptItems({
      from: r.goodsReceiptBatches.goodsReceiptLineId,
      to: r.goodsReceiptItems.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.goodsReceiptBatches.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    location: r.one.storageLocations({
      from: r.goodsReceiptBatches.locationId,
      to: r.storageLocations.id,
    }),
    goodsReceiptBatchItems: r.many.goodsReceiptBatchItems(),
  },
  goodsReceiptBatchItems: {
    goodsReceiptBatch: r.one.goodsReceiptBatches({
      from: r.goodsReceiptBatchItems.goodsReceiptBatchId,
      to: r.goodsReceiptBatches.id,
    }),
  },
  goodsReceiptItems: {
    goodsReceipt: r.one.goodsReceipts({
      from: r.goodsReceiptItems.goodsReceiptId,
      to: r.goodsReceipts.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.goodsReceiptItems.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    goodsReceiptBatches: r.many.goodsReceiptBatches(),
  },
  conversions: {
    bom: r.one.bom({
      from: r.conversions.bomId,
      to: r.bom.id,
    }),
    conversionInputs: r.many.conversionInputs(),
    conversionOutputs: r.many.conversionOutputs(),
  },
  conversionInputs: {
    conversion: r.one.conversions({
      from: r.conversionInputs.conversionId,
      to: r.conversions.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.conversionInputs.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  conversionOutputs: {
    conversion: r.one.conversions({
      from: r.conversionOutputs.conversionId,
      to: r.conversions.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.conversionOutputs.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  stockAdjustments: {
    inventoryItem: r.one.inventoryItems({
      from: r.stockAdjustments.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
  },
  stockAdjustmentLines: {
    stockAdjustment: r.one.stockAdjustments({
      from: r.stockAdjustmentLines.stockAdjustmentId,
      to: r.stockAdjustments.id,
    }),
    batch: r.one.inventoryItemBatches({
      from: r.stockAdjustmentLines.batchId,
      to: r.inventoryItemBatches.id,
    }),
    location: r.one.storageLocations({
      from: r.stockAdjustmentLines.locationId,
      to: r.storageLocations.id,
    }),
    stockAdjustmentLineItems: r.many.stockAdjustmentLineItems(),
  },
  stockAdjustmentLineItems: {
    stockAdjustmentLine: r.one.stockAdjustmentLines({
      from: r.stockAdjustmentLineItems.stockAdjustmentLineId,
      to: r.stockAdjustmentLines.id,
    }),
  },
  inventoryItemBatchItems: {
    inventoryItemBatch: r.one.inventoryItemBatches({
      from: r.inventoryItemBatchItems.inventoryItemBatchId,
      to: r.inventoryItemBatches.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemBatchItems.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  stockTransfers: {
    inventoryItem: r.one.inventoryItems({
      from: r.stockTransfers.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  invoices: {
    invoiceItems: r.many.invoiceItems(),
    payments: r.many.payments(),
    creditNoteApplications: r.many.creditNoteApplications(),
  },
  invoiceItems: {
    invoice: r.one.invoices({
      from: r.invoiceItems.invoiceId,
      to: r.invoices.id,
    }),
  },
  payments: {
    invoice: r.one.invoices({
      from: r.payments.invoiceId,
      to: r.invoices.id,
    }),
  },
  creditNotes: {
    creditNoteApplications: r.many.creditNoteApplications(),
  },
  creditNoteApplications: {
    creditNote: r.one.creditNotes({
      from: r.creditNoteApplications.creditNoteId,
      to: r.creditNotes.id,
    }),
    invoice: r.one.invoices({
      from: r.creditNoteApplications.invoiceId,
      to: r.invoices.id,
    }),
  },
  orders: {
    orderItems: r.many.orderItems(),
  },
  orderItems: {
    order: r.one.orders({
      from: r.orderItems.orderId,
      to: r.orders.id,
    }),
    item: r.one.items({
      from: r.orderItems.itemId,
      to: r.items.id,
    }),
    variant: r.one.itemVariants({
      from: r.orderItems.variantId,
      to: r.itemVariants.id,
    }),
    orderItemModifiers: r.many.orderItemModifiers(),
  },
  orderItemModifiers: {
    orderItem: r.one.orderItems({
      from: r.orderItemModifiers.orderItemId,
      to: r.orderItems.id,
    }),
  },
  storageLocationConfigs: {
    inventoryItem: r.one.inventoryItems({
      from: r.storageLocationConfigs.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    location: r.one.storageLocations({
      from: r.storageLocationConfigs.locationId,
      to: r.storageLocations.id,
    }),
  },
}));
