import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';

export type SupplierQuotationStatus = 'DRAFT' | 'POSTED';

export const SUPPLIER_QUOTATION_STATUS_LABELS: Record<SupplierQuotationStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
};

export const supplierQuotationSchema = z
  .object({
    quotationNumber: z
      .string({ error: 'Quotation number is required' })
      .min(1, 'Quotation number is required')
      .max(100),
    quotationDate: z.string({ error: 'Quotation date is required' }).min(1, 'Quotation date is required'),
    currencyCode: z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required'),
    validFrom: z.string({ error: 'Valid from is required' }).min(1, 'Valid from is required'),
    validTo: z.string().nullable().optional(),
    note: z.string().max(500, 'Note must be at most 500 characters'),
  })
  .refine((data) => !data.validTo || data.validTo >= data.validFrom, {
    message: 'Valid to must be on or after valid from',
    path: ['validTo'],
  });

export type SupplierQuotationFormData = z.infer<typeof supplierQuotationSchema>;

const quotationItemFields = {
  supplierItemCode: z.string().max(100, 'Code must be at most 100 characters'),
  unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
  mrp: zodCurrencyField({ optional: true, positive: true }),
  schemeBuyQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  taxInclusive: z.boolean(),
};

const schemeComplete = {
  check: (data: { schemeBuyQty?: number | null; schemeFreeQty?: number | null }) =>
    (data.schemeBuyQty == null) === (data.schemeFreeQty == null),
  params: { message: 'Enter both the buy and free quantity', path: ['schemeFreeQty'] },
};

export const addSupplierQuotationItemSchema = z
  .object({
    inventoryItemId: z.uuid('Item is required'),
    uomId: z.uuid('Unit is required'),
    ...quotationItemFields,
  })
  .refine(schemeComplete.check, schemeComplete.params);

export type AddSupplierQuotationItemFormData = z.infer<typeof addSupplierQuotationItemSchema>;

export const postSupplierQuotationSiteSchema = z.object({ siteId: z.uuid('Site is required') });
export type PostSupplierQuotationSiteFormData = z.infer<typeof postSupplierQuotationSiteSchema>;

export interface SupplierQuotationData {
  id: string;
  supplierId: string;
  quotationNumber: string;
  quotationDate: string;
  // One of the supplier's currencies; every line's price and MRP is in it
  currencyCode: string;
  validFrom: string;
  validTo: string | null;
  note: string | null;
  status: SupplierQuotationStatus;
  itemCount: number;
  siteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierQuotationItemData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  uomSymbol: string | null;
  unitPrice: CurrencyValue;
  mrpId: string | null;
  mrp: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;
}

export interface SupplierQuotationSiteData {
  id: string;
  siteId: string;
  siteName: string | null;
  siteCode: string | null;
  postedBy: string | null;
  postedAt: string;
}

export interface SupplierQuotationDetail extends SupplierQuotationData {
  items: SupplierQuotationItemData[];
  sites: SupplierQuotationSiteData[];
}

export type SupplierQuotationsTableResponse = TableResponse<SupplierQuotationData>;

export interface SupplierQuotationPayload {
  quotationNumber: string;
  quotationDate: string;
  validFrom: string;
  validTo: string | null;
  note: string | null;
}

export interface SupplierQuotationItemPayload {
  supplierItemCode: string | null;
  unitPrice: CurrencyValue;
  // MRP printed on the pack in the line's unit; the server records it on the item's MRPs when new. Left out when the
  // user cannot set MRP, which keeps the line's existing MRP
  mrp?: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;
}
