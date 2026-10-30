import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField, zodPhoneField } from '@vritti/quantum-ui/zod';
import type { PartyLicenseType } from './party-licenses';
import type { SiteEnrollmentStatus } from './site-suppliers';

const currencyCodeField = z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required');
const currencyCodesField = z
  .array(currencyCodeField, { error: 'Select at least one currency' })
  .min(1, 'Select at least one currency');

// The default currency is one of the supplier's currencies
const defaultCurrencyListed = {
  check: (data: { currencyCode: string; currencyCodes: string[] }) => data.currencyCodes.includes(data.currencyCode),
  params: { path: ['currencyCode'], message: 'Pick the default from the selected currencies' },
};

// A supplier now references a company party — identity lives on the company, not inline.
export const createSupplierSchema = z
  .object({
    partyId: z.uuid('Company is required'),
    code: z.string().min(1, 'Code is required').max(100),
    currencyCodes: currencyCodesField,
    currencyCode: currencyCodeField,
    defaultPaymentTermId: z.uuid().optional(),
    notes: z.string().optional(),
    purchasingBlocked: z.boolean().optional(),
    paymentBlocked: z.boolean().optional(),
    orderEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    orderPhone: zodPhoneField({ optional: true }),
    isActive: z.boolean(),
  })
  .refine(defaultCurrencyListed.check, defaultCurrencyListed.params);

export const updateSupplierSchema = z.object({
  code: z.string().min(1).max(100).optional(),
  defaultPaymentTermId: z.uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasingBlocked: z.boolean().optional(),
  paymentBlocked: z.boolean().optional(),
  orderEmail: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  orderPhone: z.union([zodPhoneField({ optional: true }), z.null()]).optional(),
});

const siteIdsField = z.array(z.uuid(), { error: 'Select at least one site' }).min(1, 'Select at least one site');

export const addSupplierItemSchema = z.object({
  inventoryItemId: z.uuid('Inventory item is required'),
  supplierItemCode: z.string().max(100).optional(),
  uomId: z.uuid('Unit of measure is required'),
  minOrderQuantity: zodNumericField({ positive: true }).optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
  siteIds: siteIdsField,
});

export const updateSupplierItemSchema = z.object({
  supplierItemCode: z.string().max(100).optional(),
  uomId: z.uuid('Unit of measure is required'),
  minOrderQuantity: zodNumericField({ positive: true, nullable: true }).optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
});

export const setSupplierItemPreferredSchema = z.object({
  siteIds: siteIdsField,
  isPreferred: z.boolean(),
});

export type SetSupplierItemPreferredFormData = z.infer<typeof setSupplierItemPreferredSchema>;

export const setSupplierItemMinOrderSchema = z.object({
  minOrderQuantity: zodNumericField({ positive: true, nullable: true }).optional(),
});

export type SetSupplierItemMinOrderFormData = z.infer<typeof setSupplierItemMinOrderSchema>;

export const setSupplierItemLeadTimeSchema = z.object({
  leadTimeDays: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
});

export type SetSupplierItemLeadTimeFormData = z.infer<typeof setSupplierItemLeadTimeSchema>;

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export const editSupplierFormSchema = updateSupplierSchema.extend({
  partyId: z.uuid(),
  currencyCode: z.string(),
});

export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
export type EditSupplierFormData = z.infer<typeof editSupplierFormSchema>;
export type AddSupplierItemFormData = z.infer<typeof addSupplierItemSchema>;
export type UpdateSupplierItemFormData = z.infer<typeof updateSupplierItemSchema>;
export type SuppliersTableResponse = TableResponse<SupplierData>;
export type SupplierItemsTableResponse = TableResponse<SupplierItemData>;
export type SiteSupplierItemsTableResponse = TableResponse<SiteSupplierItemData>;

export interface SupplierData {
  id: string;
  partyId: string;
  partyName: string;
  partyType: 'COMPANY' | 'PERSON';
  code: string;
  // The default currency; new items, quotations and POs start in it
  currencyCode: string;
  // Every currency the supplier trades in, the default included
  currencyCodes: string[];
  defaultPaymentTermId: string | null;
  defaultPaymentTermName: string | null;
  notes: string | null;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  orderEmail: string | null;
  orderPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRegistrationData {
  id: string;
  registrationNumber: string;
  registrationType: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface SupplierLicenseData {
  id: string;
  licenseType: PartyLicenseType;
  licenseNumber: string;
  region: string | null;
  validTo: string | null;
  isActive: boolean;
}

export interface SupplierItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  uomId: string;
  uomSymbol: string;
  // The least the supplier sells per order, in the item's unit
  minOrderQuantity: number | null;
  // Days from order to delivery, which every site follows unless it sets its own
  leadTimeDays: number | null;
  siteCount: number;
  // Sites where this supplier is the preferred one for the item
  preferredSiteCount: number;
}

export interface SiteSupplierItemTerms {
  itemSiteId: string | null;
  isPreferred: boolean;
  leadTimeDays: number | null;
  // True when the site sets its own lead time instead of following the supplier item's
  isLeadTimeOverridden: boolean;
  minOrderQuantity: number | null;
  unitPrice: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;
}

export interface SiteSupplierItemData extends SupplierItemData, SiteSupplierItemTerms {}

export interface SiteSupplierItemDetail extends SiteSupplierItemData {
  supplierId: string;
  supplierCode: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  supplierCurrencyCode: string;
  supplierCurrencyCodes: string[];
}

export interface SupplierItemDetail extends SupplierItemData {
  supplierId: string;
  supplierCode: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  supplierCurrencyCode: string;
  supplierCurrencyCodes: string[];
  // Price history: an item with any can neither be deleted nor change its unit
  priceCount: number;
  pricedSiteCount: number;
  canDelete: boolean;
}

export interface InventoryItemSupplierData extends SiteSupplierItemTerms {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierItemCode: string | null;
  uomId: string;
  uomSymbol: string;
  // Sites the supplier item is set up at
  siteCount: number;
}

export type InventoryItemSuppliersTableResponse = TableResponse<InventoryItemSupplierData>;

export interface SupplierDetail extends SupplierData {
  registrations: SupplierRegistrationData[];
  licenses: SupplierLicenseData[];
  enrolledSiteCount: number;
  itemCount: number;
}

export const changeSupplierCurrencySchema = z
  .object({ currencyCodes: currencyCodesField, currencyCode: currencyCodeField })
  .refine(defaultCurrencyListed.check, defaultCurrencyListed.params);

export type ChangeSupplierCurrencyFormData = z.infer<typeof changeSupplierCurrencySchema>;

// One of the legal entity's sites with the supplier's enrollment there; `id` is the enrollment, null when not enrolled
export interface SupplierSiteRow {
  id: string | null;
  supplierId: string;
  siteId: string;
  siteName: string | null;
  siteCode: string | null;
  enrollmentStatus: SiteEnrollmentStatus;
  paymentTermId: string | null;
  paymentTermName: string | null;
  partyTaxRegistrationId: string | null;
  registrationNumber: string | null;
  partyBankAccountId: string | null;
  bankAccountName: string | null;
  orderRelationshipId: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  createdAt: string | null;
}

export type SupplierSitesTableResponse = TableResponse<SupplierSiteRow>;

export const addSupplierSiteSchema = z.object({
  siteId: z.uuid('Site is required'),
  paymentTermId: z.uuid('Payment term is required'),
  partyTaxRegistrationId: z.uuid('Tax registration is required'),
  partyBankAccountId: z.uuid().nullable().optional(),
  orderRelationshipId: z.uuid().nullable().optional(),
});

export const updateSupplierSiteSchema = z.object({
  paymentTermId: z.uuid('Payment term is required'),
  partyTaxRegistrationId: z.uuid('Tax registration is required'),
  partyBankAccountId: z.uuid().nullable().optional(),
  orderRelationshipId: z.uuid().nullable().optional(),
});

export type AddSupplierSiteFormData = z.infer<typeof addSupplierSiteSchema>;
export type UpdateSupplierSiteFormData = z.infer<typeof updateSupplierSiteSchema>;

const PRICE_SOURCES = ['QUOTATION', 'MANUAL'] as const;
export type SupplierPriceSource = (typeof PRICE_SOURCES)[number];
export const PRICE_SOURCE_LABELS: Record<SupplierPriceSource, string> = {
  QUOTATION: 'Quotation',
  MANUAL: 'Manual',
};

export interface SupplierItemPriceRow {
  id: string;
  supplierItemId: string;
  legalEntityId: string;
  siteId: string;
  siteName?: string | null;
  siteCode?: string | null;
  unitPrice: CurrencyValue;
  mrpId: string | null;
  mrp: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;
  validFrom: string;
  validTo: string | null;
  source: SupplierPriceSource;
  // Set when a quotation posted the price; it then changes only through the quotation
  quotationSiteId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type SupplierItemPricesTableResponse = TableResponse<SupplierItemPriceRow>;

// A price row of one supplier for an inventory item, with the supplier and the unit the price is per
export interface ItemSupplierPriceRow extends SupplierItemPriceRow {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  uomSymbol: string | null;
}

export type ItemSupplierPricesTableResponse = TableResponse<ItemSupplierPriceRow>;

export interface PriceWindow {
  id: string;
  unitPrice: CurrencyValue;
  validFrom: string;
  validTo: string | null;
}

export interface SitePriceHistory {
  siteId: string;
  siteName?: string | null;
  siteCode?: string | null;
  current: PriceWindow | null;
  previous: PriceWindow | null;
  next: PriceWindow | null;
  windows: PriceWindow[];
}

// One supplier's prices for an inventory item at a site, converted to the item's primary unit
export interface ItemSupplierPriceHistory {
  supplierId: string;
  supplierItemId: string;
  supplierName: string;
  supplierCode: string;
  quotedUomSymbol: string | null;
  current: PriceWindow | null;
  previous: PriceWindow | null;
  next: PriceWindow | null;
  windows: PriceWindow[];
}

export interface InventoryItemPriceHistory {
  siteId: string | null;
  // Every supplier's prices are per this unit
  uomSymbol: string | null;
  // The suppliers drawn: the ones asked for, or by default the preferred then most recently priced; at most 8
  suppliers: ItemSupplierPriceHistory[];
  // Every supplier with a price for the item at the site within the window
  supplierCount: number;
}

// What a price graph shows, as saved in its live table state; empty supplier ids means the server chose the ones drawn
export interface PriceGraphSelection {
  siteId: string | null;
  from: string;
  to: string;
  supplierIds: string[];
  mrpIds: string[];
  currency: string | null;
}

export interface InventoryItemPriceGraph extends InventoryItemPriceHistory {
  selection: PriceGraphSelection;
}

// One supplier item's standing for an inventory item at a site on a date: the price in force per its own unit and per
// the item's primary unit, what its scheme makes it cost, and how it last moved
export interface ItemSupplierPriceComparisonRow {
  supplierItemId: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  quotedUomSymbol: string | null;
  isPreferred: boolean;
  currentPrice: CurrencyValue | null;
  currentFrom: string | null;
  currentTo: string | null;
  effectivePrice: CurrencyValue | null;
  pricePerPrimary: CurrencyValue | null;
  effectivePricePerPrimary: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  mrp: CurrencyValue | null;
  previousPrice: CurrencyValue | null;
  changePercent: number | null;
  priceCount: number;
}

export type ItemSupplierPriceComparisonTableResponse = TableResponse<ItemSupplierPriceComparisonRow> & {
  // Sites the item has supplier prices at, and the one the table shows when none is picked
  siteIds: string[];
  defaultSiteId: string | null;
  // The site the rows are at: the one asked for when the item is priced there, else the default
  siteId: string | null;
};

// What the prices table is about — set in its context bar, not saved: a site (the default when omitted) and a day, as
// YYYY-MM-DD or yesterday / today / tomorrow
export interface PricesTableContext {
  site?: string;
  asOf: string;
}

// Each window carries its own currency; a supplier can requote an item in another of its currencies
export interface SupplierItemPriceHistory {
  sites: SitePriceHistory[];
}

const supplierItemPriceFields = {
  unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
  mrpId: z.uuid().optional(),
  schemeBuyQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  taxInclusive: z.boolean(),
  validFrom: z.string({ error: 'Valid from is required' }).min(1, 'Valid from is required'),
  validTo: z.string().nullable().optional(),
  note: z.string().max(500, 'Note must be at most 500 characters'),
};

const validToAfterValidFrom = {
  check: (data: { validFrom: string; validTo?: string | null }) =>
    !data.validTo || new Date(data.validTo) >= new Date(data.validFrom),
  params: { message: 'Valid to must be on or after valid from', path: ['validTo'] },
};

export const addSupplierItemPriceSchema = z
  .object(supplierItemPriceFields)
  .refine(validToAfterValidFrom.check, validToAfterValidFrom.params);

export const addLeSupplierItemPriceSchema = z
  .object({
    ...supplierItemPriceFields,
    siteIds: siteIdsField,
  })
  .refine(validToAfterValidFrom.check, validToAfterValidFrom.params);

export const updateSupplierItemPriceSchema = z.object({
  unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
  mrpId: z.uuid().optional(),
  schemeBuyQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  taxInclusive: z.boolean(),
  validTo: z.string().optional(),
});

export type AddSupplierItemPriceFormData = z.infer<typeof addSupplierItemPriceSchema>;
export type AddLeSupplierItemPriceFormData = z.infer<typeof addLeSupplierItemPriceSchema>;
export type UpdateSupplierItemPriceFormData = z.infer<typeof updateSupplierItemPriceSchema>;

export interface SupplierItemSiteRow {
  id: string;
  supplierItemId: string;
  legalEntityId: string;
  siteId: string;
  inventoryItemId: string;
  siteName: string | null;
  siteCode: string | null;
  isPreferred: boolean;
  leadTimeDays: number | null;
  // True when the site sets its own lead time instead of following the supplier item's
  isLeadTimeOverridden: boolean;
  createdAt: string;
}

export type SupplierItemSitesTableResponse = TableResponse<SupplierItemSiteRow>;

export const addSupplierItemSiteSchema = z.object({
  siteId: z.uuid('Site is required'),
  isPreferred: z.boolean(),
  leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
});

export const updateSupplierItemSiteSchema = z.object({
  isPreferred: z.boolean(),
  // On: the site follows the supplier item's lead time; off: the lead time below is the site's own
  followItemLeadTime: z.boolean(),
  leadTimeDays: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
});

export type AddSupplierItemSiteFormData = z.infer<typeof addSupplierItemSiteSchema>;
export type UpdateSupplierItemSiteFormData = z.infer<typeof updateSupplierItemSiteSchema>;
