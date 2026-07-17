import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField, zodPhoneField } from '@vritti/quantum-ui/zod';

// A supplier now references a company party — identity lives on the company, not inline.
export const createSupplierSchema = z.object({
  partyId: z.uuid('Company is required'),
  code: z.string().min(1, 'Code is required').max(100),
  currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
  paymentTerms: z.string().max(50, 'Payment terms must be at most 50 characters').optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

export const updateSupplierSchema = z.object({
  partyId: z.uuid('Company is required').optional(),
  code: z.string().min(1).max(100).optional(),
  currencyCode: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .optional(),
  paymentTerms: z.string().max(50).nullable().optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createSupplierContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(255),
  phone: zodPhoneField(),
  alternatePhone: zodPhoneField({ optional: true }),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  alternateEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  designation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  isPrimary: z.boolean().optional(),
});

export const updateSupplierContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: zodPhoneField(),
  alternatePhone: z.union([zodPhoneField({ optional: true }), z.null()]).optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  alternateEmail: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  designation: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Standing free-goods scheme (buy + free ratio) carried on a supplier item.
const supplierSchemeShape = {
  schemeBuyQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
  hasScheme: z.boolean(),
};

// When a scheme is enabled, the buy/free ratio is required.
const enforceSchemeRatio = (
  data: { hasScheme: boolean; schemeBuyQty?: number | null; schemeFreeQty?: number | null },
  ctx: z.RefinementCtx,
) => {
  if (!data.hasScheme) return;
  if (data.schemeBuyQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeBuyQty'], message: 'Buy qty is required for a scheme.' });
  }
  if (data.schemeFreeQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeFreeQty'], message: 'Free qty is required for a scheme.' });
  }
};

// Scheme-only form used by the bulk "Set Scheme" action on the supplier items table.
export const setSupplierItemSchemeSchema = z.object(supplierSchemeShape).superRefine(enforceSchemeRatio);
export type SetSupplierItemSchemeFormData = z.infer<typeof setSupplierItemSchemeSchema>;

export const addSupplierItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Inventory item is required'),
    supplierItemCode: z.string().max(100).optional(),
    unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
    uomId: z.uuid('Unit of measure is required'),
    minOrderQuantity: zodNumericField({ integer: true, positive: true }).optional(),
    leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
    isPreferred: z.boolean().optional(),
    taxInclusive: z.boolean(),
    ...supplierSchemeShape,
  })
  .superRefine(enforceSchemeRatio);

export const updateSupplierItemSchema = z
  .object({
    supplierItemCode: z.string().max(100).optional(),
    unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
    uomId: z.uuid('Unit of measure is required'),
    minOrderQuantity: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
    leadTimeDays: zodNumericField({ integer: true, positive: true, nullable: true }).optional(),
    isPreferred: z.boolean().optional(),
    isActive: z.boolean().optional(),
    taxInclusive: z.boolean(),
    ...supplierSchemeShape,
  })
  .superRefine(enforceSchemeRatio);

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierContactFormData = z.infer<typeof createSupplierContactSchema>;
export type UpdateSupplierContactFormData = z.infer<typeof updateSupplierContactSchema>;
export type AddSupplierItemFormData = z.infer<typeof addSupplierItemSchema>;
export type UpdateSupplierItemFormData = z.infer<typeof updateSupplierItemSchema>;
export type SuppliersTableResponse = TableResponse<SupplierData>;
export type SupplierItemsTableResponse = TableResponse<SupplierItemData>;

export interface SupplierData {
  id: string;
  partyId: string;
  partyName: string;
  code: string;
  currencyCode: string;
  paymentTerms: string | null;
  leadTimeDays: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  unitPrice: { currency: string; value: string };
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
  taxInclusive: boolean;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
}

export interface InventoryItemSupplierData {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierItemCode: string | null;
  unitPrice: { currency: string; value: string };
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
}

export type InventoryItemSuppliersTableResponse = TableResponse<InventoryItemSupplierData>;

export type SupplierDetail = SupplierData;

export interface SupplierContactData {
  id: string;
  supplierId: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  alternateEmail: string | null;
  designation: string | null;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const changeSupplierCurrencySchema = z.object({
  currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
  conversionRate: zodNumericField({ required: 'Conversion rate is required', positive: true, nonZero: true }),
});

export type ChangeSupplierCurrencyFormData = z.infer<typeof changeSupplierCurrencySchema>;
