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
    priceListItems: r.many.priceListItems(),
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
    inventoryItemQuants: r.many.inventoryItemQuants(),
    inventoryItemQuantItems: r.many.inventoryItemQuantItems(),
    inventoryItemLots: r.many.inventoryItemLots(),
    inventoryItemLedger: r.many.inventoryItemLedger(),
    stockAdjustments: r.many.stockAdjustments(),
    stockTransfers: r.many.stockTransfers(),
    inventoryItemLocations: r.many.inventoryItemLocations(),
  },
  locations: {
    inventoryItemQuants: r.many.inventoryItemQuants(),
    inventoryItemLocations: r.many.inventoryItemLocations(),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
    goodsReceiptLines: r.many.goodsReceiptLines(),
    posTerminals: r.many.posTerminals(),
  },
  posTerminals: {
    location: r.one.locations({
      from: r.posTerminals.locationId,
      to: r.locations.id,
    }),
    terminalPriceLists: r.many.terminalPriceLists(),
  },
  priceLists: {
    priceListItems: r.many.priceListItems(),
    terminalPriceLists: r.many.terminalPriceLists(),
  },
  priceListItems: {
    priceList: r.one.priceLists({
      from: r.priceListItems.priceListId,
      to: r.priceLists.id,
    }),
    itemVariant: r.one.itemVariants({
      from: r.priceListItems.itemVariantId,
      to: r.itemVariants.id,
    }),
  },
  terminalPriceLists: {
    terminal: r.one.posTerminals({
      from: r.terminalPriceLists.terminalId,
      to: r.posTerminals.id,
    }),
    priceList: r.one.priceLists({
      from: r.terminalPriceLists.priceListId,
      to: r.priceLists.id,
    }),
  },
  inventoryItemQuants: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemQuants.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    location: r.one.locations({
      from: r.inventoryItemQuants.locationId,
      to: r.locations.id,
    }),
    lot: r.one.inventoryItemLots({
      from: r.inventoryItemQuants.lotId,
      to: r.inventoryItemLots.id,
    }),
    inventoryItemQuantItems: r.many.inventoryItemQuantItems(),
  },
  inventoryItemLots: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemLots.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    inventoryItemQuants: r.many.inventoryItemQuants(),
  },
  inventoryStockLevels: {},
  inventoryItemLedger: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemLedger.inventoryItemId,
      to: r.inventoryItems.id,
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
  goodsReceiptItems: {
    goodsReceipt: r.one.goodsReceipts({
      from: r.goodsReceiptItems.goodsReceiptId,
      to: r.goodsReceipts.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.goodsReceiptItems.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    goodsReceiptLots: r.many.goodsReceiptLots(),
    goodsReceiptLines: r.many.goodsReceiptLines(),
  },
  goodsReceiptLots: {
    goodsReceiptItem: r.one.goodsReceiptItems({
      from: r.goodsReceiptLots.goodsReceiptItemId,
      to: r.goodsReceiptItems.id,
    }),
    resolvedLot: r.one.inventoryItemLots({
      from: r.goodsReceiptLots.resolvedLotId,
      to: r.inventoryItemLots.id,
    }),
    goodsReceiptLines: r.many.goodsReceiptLines(),
  },
  goodsReceiptLines: {
    goodsReceiptItem: r.one.goodsReceiptItems({
      from: r.goodsReceiptLines.goodsReceiptItemId,
      to: r.goodsReceiptItems.id,
    }),
    goodsReceiptLot: r.one.goodsReceiptLots({
      from: r.goodsReceiptLines.goodsReceiptLotId,
      to: r.goodsReceiptLots.id,
    }),
    location: r.one.locations({
      from: r.goodsReceiptLines.locationId,
      to: r.locations.id,
    }),
    resolvedQuant: r.one.inventoryItemQuants({
      from: r.goodsReceiptLines.resolvedQuantId,
      to: r.inventoryItemQuants.id,
    }),
    goodsReceiptLineItems: r.many.goodsReceiptLineItems(),
  },
  goodsReceiptLineItems: {
    goodsReceiptLine: r.one.goodsReceiptLines({
      from: r.goodsReceiptLineItems.goodsReceiptLineId,
      to: r.goodsReceiptLines.id,
    }),
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
    stockAdjustmentLots: r.many.stockAdjustmentLots(),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
  },
  stockAdjustmentLots: {
    stockAdjustment: r.one.stockAdjustments({
      from: r.stockAdjustmentLots.stockAdjustmentId,
      to: r.stockAdjustments.id,
    }),
    resolvedLot: r.one.inventoryItemLots({
      from: r.stockAdjustmentLots.resolvedLotId,
      to: r.inventoryItemLots.id,
    }),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
  },
  stockAdjustmentLines: {
    stockAdjustment: r.one.stockAdjustments({
      from: r.stockAdjustmentLines.stockAdjustmentId,
      to: r.stockAdjustments.id,
    }),
    stockAdjustmentLot: r.one.stockAdjustmentLots({
      from: r.stockAdjustmentLines.stockAdjustmentLotId,
      to: r.stockAdjustmentLots.id,
    }),
    quant: r.one.inventoryItemQuants({
      from: r.stockAdjustmentLines.quantId,
      to: r.inventoryItemQuants.id,
    }),
    location: r.one.locations({
      from: r.stockAdjustmentLines.locationId,
      to: r.locations.id,
    }),
    resolvedQuant: r.one.inventoryItemQuants({
      from: r.stockAdjustmentLines.resolvedQuantId,
      to: r.inventoryItemQuants.id,
    }),
    stockAdjustmentLineItems: r.many.stockAdjustmentLineItems(),
  },
  stockAdjustmentLineItems: {
    stockAdjustmentLine: r.one.stockAdjustmentLines({
      from: r.stockAdjustmentLineItems.stockAdjustmentLineId,
      to: r.stockAdjustmentLines.id,
    }),
  },
  inventoryItemQuantItems: {
    inventoryItemQuant: r.one.inventoryItemQuants({
      from: r.inventoryItemQuantItems.inventoryItemQuantId,
      to: r.inventoryItemQuants.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemQuantItems.inventoryItemId,
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
  inventoryItemLocations: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemLocations.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    location: r.one.locations({
      from: r.inventoryItemLocations.locationId,
      to: r.locations.id,
    }),
  },
}));
