import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodCurrencyField, zodNumericField, zodPhoneField } from '@vritti/quantum-ui/zod';

export const TAX_ID_TYPE_OPTIONS = [
  { value: 'GST', label: 'GST' },
  { value: 'VAT', label: 'VAT' },
  { value: 'EIN', label: 'EIN' },
  { value: 'SALES_TAX', label: 'Sales Tax' },
  { value: 'OTHER', label: 'Other' },
];

const taxIdTypeSchema = z.enum(['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER']);

const enforceTaxIdPair = (
  taxId: string | null | undefined,
  taxIdType: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER' | null | undefined,
  ctx: z.RefinementCtx,
) => {
  const hasTaxId = typeof taxId === 'string' && taxId.trim().length > 0;
  const hasTaxIdType = typeof taxIdType === 'string' && taxIdType.length > 0;

  if (hasTaxId === hasTaxIdType) return;

  if (hasTaxIdType && !hasTaxId) {
    ctx.addIssue({
      code: 'custom',
      path: ['taxId'],
      message: 'Tax ID is required when Tax ID Type is selected.',
    });
  }

  if (hasTaxId && !hasTaxIdType) {
    ctx.addIssue({
      code: 'custom',
      path: ['taxIdType'],
      message: 'Tax ID Type is required when Tax ID is provided.',
    });
  }
};

export const createSupplierSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    code: z.string().min(1, 'Code is required').max(100),
    currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
    contactName: z.string().min(1, 'Primary contact name is required').max(255),
    phone: zodPhoneField(),
    alternatePhone: zodPhoneField({ optional: true }),
    email: z.email('Invalid email').optional().or(z.literal('')),
    alternateEmail: z.email('Invalid email').optional().or(z.literal('')),
    designation: z.string().max(100).optional(),
    website: z.string().max(255).optional(),
    address: z.string().max(500).optional(),
    taxId: z.string().max(15, 'Tax ID must be at most 15 characters').optional(),
    taxIdType: taxIdTypeSchema.optional(),
    paymentTerms: z.string().max(50, 'Payment terms must be at most 50 characters').optional(),
    leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => enforceTaxIdPair(data.taxId, data.taxIdType, ctx));

export const updateSupplierSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(100).optional(),
    currencyCode: z
      .string()
      .regex(/^[A-Z]{3}$/, 'Invalid currency code')
      .optional(),
    website: z.string().max(255).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
    taxId: z.string().max(15).nullable().optional(),
    taxIdType: taxIdTypeSchema.nullable().optional(),
    paymentTerms: z.string().max(50).nullable().optional(),
    leadTimeDays: zodNumericField({ integer: true, positive: true }).nullable().catch(null).optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => enforceTaxIdPair(data.taxId, data.taxIdType, ctx));

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

export const addSupplierItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  supplierItemCode: z.string().max(100).optional(),
  unitPrice: zodCurrencyField({ required: 'Unit price is required' }),
  uomId: z.uuid('Unit of measure is required'),
  minOrderQuantity: zodNumericField({ integer: true, positive: true }).optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true }).optional(),
  isPreferred: z.boolean().optional(),
});

export const updateSupplierItemSchema = z.object({
  supplierItemCode: z.string().max(100).optional(),
  unitPrice: zodCurrencyField({ required: 'Unit price is required' }),
  uomId: z.uuid('Unit of measure is required'),
  minOrderQuantity: zodNumericField({ integer: true, positive: true }).nullable().catch(null).optional(),
  leadTimeDays: zodNumericField({ integer: true, positive: true }).nullable().catch(null).optional(),
  isPreferred: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

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
  name: string;
  code: string;
  currencyCode: string;
  contactName: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  taxIdType: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER' | null;
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
