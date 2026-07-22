import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import {
  type PartyFunctionAssignment,
  type PartyFunctionOption,
  type PartyFunctionResponse,
  partyFunctionAssignmentSchema,
} from './party-functions';

const ADDRESS_FUNCTIONS = ['REGISTERED', 'BILLING', 'SHIPPING', 'ORDERING'] as const;

export type AddressFunction = (typeof ADDRESS_FUNCTIONS)[number];

export const ADDRESS_FUNCTION_LABELS: Record<AddressFunction, string> = {
  REGISTERED: 'Registered',
  BILLING: 'Bill-to',
  SHIPPING: 'Ship-to',
  ORDERING: 'Ordering',
};

export const ADDRESS_FUNCTION_OPTIONS: PartyFunctionOption[] = ADDRESS_FUNCTIONS.map((value) => ({
  value,
  label: ADDRESS_FUNCTION_LABELS[value],
}));

export const addAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(255, 'Address line 1 must be at most 255 characters'),
  line2: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  region: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2, 'Select a country'),
  functions: z.array(partyFunctionAssignmentSchema),
});

export type AddAddressFormData = z.infer<typeof addAddressSchema>;

export interface AddAddressPayload {
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  functions?: PartyFunctionAssignment[];
}

export interface PartyAddressRow {
  id: string;
  partyId: string;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  isActive: boolean;
  functions: PartyFunctionResponse[];
  createdAt: string;
}

export type PartyAddressesTableResponse = TableResponse<PartyAddressRow>;
