import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  contactName: z.string().min(1, 'Primary contact name is required').max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  designation: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  gstin: z.string().max(15, 'GSTIN must be at most 15 characters').optional(),
  paymentTerms: z.string().max(50, 'Payment terms must be at most 50 characters').optional(),
  leadTimeDays: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(100).optional(),
  address: z.string().max(500).nullable().optional(),
  gstin: z.string().max(15).nullable().optional(),
  paymentTerms: z.string().max(50).nullable().optional(),
  leadTimeDays: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createSupplierContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  designation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  isPrimary: z.boolean().optional(),
});

export const updateSupplierContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  designation: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const linkSupplierItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  supplierCode: z.string().max(100).optional(),
  unitPrice: z.string().optional(),
  uomId: z.uuid('Unit of measure is required'),
  minOrderQuantity: z.string().optional(),
  leadTimeDays: z.string().optional(),
  isPreferred: z.boolean().optional(),
});

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierContactFormData = z.infer<typeof createSupplierContactSchema>;
export type UpdateSupplierContactFormData = z.infer<typeof updateSupplierContactSchema>;
export type LinkSupplierItemFormData = z.infer<typeof linkSupplierItemSchema>;
export type SuppliersTableResponse = TableResponse<SupplierData>;
export type SupplierItemsTableResponse = TableResponse<SupplierItemData>;

export interface SupplierData {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
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
  inventoryItemName: string | null;
  supplierCode: string | null;
  unitPrice: number | null;
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
}

export type SupplierDetail = SupplierData;

export interface SupplierContactData {
  id: string;
  supplierId: string;
  name: string;
  phone: string | null;
  email: string | null;
  designation: string | null;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
