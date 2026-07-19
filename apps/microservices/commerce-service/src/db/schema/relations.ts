import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  categories: {
    defaultTaxClass: r.one.taxClasses({
      from: r.categories.defaultTaxClassId,
      to: r.taxClasses.id,
    }),
    inventoryItems: r.many.inventoryItems(),
  },
  offerings: {
    catalog: r.one.catalogs({
      from: r.offerings.catalogId,
      to: r.catalogs.id,
    }),
    salesTaxGroup: r.one.taxGroups({
      from: r.offerings.salesTaxGroupId,
      to: r.taxGroups.id,
    }),
    offeringOptions: r.many.offeringOptions(),
    itemFieldValues: r.many.itemFieldValues(),
    orderItems: r.many.orderItems(),
  },
  offeringOptions: {
    offering: r.one.offerings({
      from: r.offeringOptions.offeringId,
      to: r.offerings.id,
    }),
    variantOption: r.one.variantOptions({
      from: r.offeringOptions.variantOptionId,
      to: r.variantOptions.id,
    }),
  },
  variantOptions: {
    catalog: r.one.catalogs({
      from: r.variantOptions.catalogId,
      to: r.catalogs.id,
    }),
    values: r.many.variantOptionValues(),
  },
  variantOptionValues: {
    variantOption: r.one.variantOptions({
      from: r.variantOptionValues.variantOptionId,
      to: r.variantOptions.id,
    }),
  },
  offeringVariants: {
    components: r.many.offeringVariantComponents(),
    orderItems: r.many.orderItems(),
  },
  offeringVariantOptionValues: {
    variantOptionValue: r.one.variantOptionValues({
      from: r.offeringVariantOptionValues.variantOptionValueId,
      to: r.variantOptionValues.id,
    }),
  },
  offeringVariantComponents: {
    variant: r.one.offeringVariants({
      from: r.offeringVariantComponents.offeringVariantId,
      to: r.offeringVariants.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.offeringVariantComponents.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  modifierGroups: {
    catalog: r.one.catalogs({
      from: r.modifierGroups.catalogId,
      to: r.catalogs.id,
    }),
  },
  modifierOptions: {},
  offeringModifierGroups: {},
  salesChannels: {
    catalogChannels: r.many.catalogChannels(),
    orders: r.many.orders(),
  },
  catalogs: {
    channelAssignments: r.many.catalogChannels(),
    offerings: r.many.offerings(),
    modifierGroups: r.many.modifierGroups(),
    variantOptions: r.many.variantOptions(),
  },
  catalogChannels: {
    catalog: r.one.catalogs({
      from: r.catalogChannels.catalogId,
      to: r.catalogs.id,
    }),
    channel: r.one.salesChannels({
      from: r.catalogChannels.channelId,
      to: r.salesChannels.id,
    }),
  },
  taxGroups: {
    taxRates: r.many.taxRates(),
    offerings: r.many.offerings(),
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
    offering: r.one.offerings({
      from: r.itemFieldValues.itemId,
      to: r.offerings.id,
    }),
    fieldDefinition: r.one.itemFieldDefinitions({
      from: r.itemFieldValues.fieldDefinitionId,
      to: r.itemFieldDefinitions.id,
    }),
  },
  uomDimensions: {
    uom: r.many.uom(),
  },
  uom: {
    dimension: r.one.uomDimensions({
      from: r.uom.dimensionId,
      to: r.uomDimensions.id,
    }),
    inventoryItems: r.many.inventoryItems(),
    supplierItems: r.many.supplierItems(),
    goodsReceiptItems: r.many.goodsReceiptItems(),
    purchaseOrderItems: r.many.purchaseOrderItems(),
    stockAdjustmentLines: r.many.stockAdjustmentLines(),
    inventoryItemUomConversions: r.many.inventoryItemUomConversions(),
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
    supplierItems: r.many.supplierItems(),
    inventoryItemUomConversions: r.many.inventoryItemUomConversions(),
    purchaseOrderItems: r.many.purchaseOrderItems(),
    goodsReceiptItems: r.many.goodsReceiptItems(),
    inventoryItemQuants: r.many.inventoryItemQuants(),
    inventoryItemSerials: r.many.inventoryItemSerials(),
    inventoryItemLots: r.many.inventoryItemLots(),
    inventoryItemLedger: r.many.inventoryItemLedger(),
    stockAdjustments: r.many.stockAdjustments(),
    stockTransfers: r.many.stockTransfers(),
    inventoryItemLocations: r.many.inventoryItemLocations(),
    inventoryItemSites: r.many.inventoryItemSites(),
    inventoryItemMrps: r.many.inventoryItemMrps(),
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
    catalog: r.one.catalogs({
      from: r.posTerminals.catalogId,
      to: r.catalogs.id,
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
    supplier: r.one.suppliers({
      from: r.inventoryItemQuants.supplierId,
      to: r.suppliers.id,
    }),
    inventoryItemSerials: r.many.inventoryItemSerials(),
    inventoryItemQuantCosts: r.many.inventoryItemQuantCosts(),
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
  suppliers: {
    party: r.one.parties({
      from: r.suppliers.partyId,
      to: r.parties.id,
    }),
    supplierItems: r.many.supplierItems(),
    supplierSites: r.many.supplierSites(),
    purchaseOrders: r.many.purchaseOrders(),
    goodsReceipts: r.many.goodsReceipts(),
    inventoryItemQuants: r.many.inventoryItemQuants(),
  },
  supplierSites: {
    supplier: r.one.suppliers({
      from: r.supplierSites.supplierId,
      to: r.suppliers.id,
    }),
    taxRegistration: r.one.partyTaxRegistrations({
      from: r.supplierSites.partyTaxRegistrationId,
      to: r.partyTaxRegistrations.id,
    }),
    bankAccount: r.one.partyBankAccounts({
      from: r.supplierSites.partyBankAccountId,
      to: r.partyBankAccounts.id,
    }),
  },
  parties: {
    jurisdiction: r.one.taxJurisdictions({
      from: r.parties.jurisdictionId,
      to: r.taxJurisdictions.id,
    }),
    taxRegistrations: r.many.partyTaxRegistrations(),
    licenses: r.many.partyLicenses(),
    bankAccounts: r.many.partyBankAccounts(),
  },
  partyLicenses: {
    party: r.one.parties({
      from: r.partyLicenses.partyId,
      to: r.parties.id,
    }),
  },
  partyBankAccounts: {
    party: r.one.parties({
      from: r.partyBankAccounts.partyId,
      to: r.parties.id,
    }),
  },
  partyRelationships: {
    parentParty: r.one.parties({
      from: r.partyRelationships.parentPartyId,
      to: r.parties.id,
    }),
    childParty: r.one.parties({
      from: r.partyRelationships.childPartyId,
      to: r.parties.id,
    }),
  },
  partyTaxRegistrations: {
    party: r.one.parties({
      from: r.partyTaxRegistrations.partyId,
      to: r.parties.id,
    }),
    jurisdiction: r.one.taxJurisdictions({
      from: r.partyTaxRegistrations.jurisdictionId,
      to: r.taxJurisdictions.id,
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
    prices: r.many.supplierItemPrices(),
    siteOverrides: r.many.supplierItemSites(),
  },
  supplierItemPrices: {
    supplierItem: r.one.supplierItems({
      from: r.supplierItemPrices.supplierItemId,
      to: r.supplierItems.id,
    }),
  },
  supplierItemSites: {
    supplierItem: r.one.supplierItems({
      from: r.supplierItemSites.supplierItemId,
      to: r.supplierItems.id,
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
    uom: r.one.uom({
      from: r.purchaseOrderItems.uomId,
      to: r.uom.id,
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
    uom: r.one.uom({
      from: r.goodsReceiptItems.uomId,
      to: r.uom.id,
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
    uom: r.one.uom({
      from: r.stockAdjustmentLines.uomId,
      to: r.uom.id,
    }),
    stockAdjustmentLineItems: r.many.stockAdjustmentLineItems(),
  },
  stockAdjustmentLineItems: {
    stockAdjustmentLine: r.one.stockAdjustmentLines({
      from: r.stockAdjustmentLineItems.stockAdjustmentLineId,
      to: r.stockAdjustmentLines.id,
    }),
  },
  inventoryItemSerials: {
    inventoryItemQuant: r.one.inventoryItemQuants({
      from: r.inventoryItemSerials.inventoryItemQuantId,
      to: r.inventoryItemQuants.id,
    }),
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemSerials.inventoryItemId,
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
    salesChannel: r.one.salesChannels({
      from: r.orders.channelId,
      to: r.salesChannels.id,
    }),
    customer: r.one.customers({
      from: r.orders.customerId,
      to: r.customers.id,
    }),
    orderItems: r.many.orderItems(),
  },
  customers: {
    orders: r.many.orders(),
  },
  orderItems: {
    order: r.one.orders({
      from: r.orderItems.orderId,
      to: r.orders.id,
    }),
    offering: r.one.offerings({
      from: r.orderItems.offeringId,
      to: r.offerings.id,
    }),
    offeringVariant: r.one.offeringVariants({
      from: r.orderItems.offeringVariantId,
      to: r.offeringVariants.id,
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
  inventoryItemSites: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemSites.inventoryItemId,
      to: r.inventoryItems.id,
    }),
  },
  inventoryItemMrps: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemMrps.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    sourceLot: r.one.inventoryItemLots({
      from: r.inventoryItemMrps.sourceLotId,
      to: r.inventoryItemLots.id,
    }),
  },
  costCategories: {
    inventoryItemCosts: r.many.inventoryItemCosts(),
  },
  inventoryItemCosts: {
    category: r.one.costCategories({
      from: r.inventoryItemCosts.categoryId,
      to: r.costCategories.id,
    }),
    inventoryItemQuantCosts: r.many.inventoryItemQuantCosts(),
  },
  inventoryItemQuantCosts: {
    quant: r.one.inventoryItemQuants({
      from: r.inventoryItemQuantCosts.quantId,
      to: r.inventoryItemQuants.id,
    }),
    cost: r.one.inventoryItemCosts({
      from: r.inventoryItemQuantCosts.costId,
      to: r.inventoryItemCosts.id,
    }),
  },
  inventoryItemUomConversions: {
    inventoryItem: r.one.inventoryItems({
      from: r.inventoryItemUomConversions.inventoryItemId,
      to: r.inventoryItems.id,
    }),
    uom: r.one.uom({
      from: r.inventoryItemUomConversions.uomId,
      to: r.uom.id,
    }),
  },
}));
