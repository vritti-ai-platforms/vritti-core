import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const ADDRESS_TYPES = ['REGISTERED', 'BILLING', 'SHIPPING', 'OTHER'] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

const addressTypeSchema = z.enum(ADDRESS_TYPES);

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  REGISTERED: 'Registered',
  BILLING: 'Billing',
  SHIPPING: 'Shipping',
  OTHER: 'Other',
};

export const ADDRESS_TYPE_OPTIONS = ADDRESS_TYPES.map((value) => ({
  value,
  label: ADDRESS_TYPE_LABELS[value],
}));

export const addAddressSchema = z.object({
  type: addressTypeSchema,
  line1: z.string().min(1, 'Address line 1 is required').max(255, 'Address line 1 must be at most 255 characters'),
  line2: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  region: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2, 'Select a country'),
  isPrimary: z.boolean().optional(),
});

export type AddAddressFormData = z.infer<typeof addAddressSchema>;

export interface AddAddressPayload {
  type: AddressType;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary?: boolean;
}

export interface PartyAddressRow {
  id: string;
  partyId: string;
  type: AddressType;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export type PartyAddressesTableResponse = TableResponse<PartyAddressRow>;
