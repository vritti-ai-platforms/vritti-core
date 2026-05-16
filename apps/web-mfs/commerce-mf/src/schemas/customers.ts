import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { isValidPhoneNumber } from '@vritti/quantum-ui/PhoneField';
import { z } from '@vritti/quantum-ui/zod';

const zPhoneNumber = z.string().refine((value) => isValidPhoneNumber(value), {
  message: 'Invalid phone number',
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: zPhoneNumber,
  email: z.email('Invalid email').optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: zPhoneNumber.optional(),
  email: z.email('Invalid email').nullable().optional().or(z.literal('')),
  notes: z.string().max(1000).nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
export type CustomersTableResponse = TableResponse<CustomerData>;

export interface CustomerData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerDetail = CustomerData;
