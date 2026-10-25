import type { CurrencyAmount } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export interface CartData {
  id: string;
  siteId: string | null;
  legalEntityId: string;
  partyId: string;
  partyName: string;
  checkoutStartedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CartsTableResponse = TableResponse<CartData>;

export interface CartLineData {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  quantity: number;
  name: string;
  code: string | null;
  unitPrice: CurrencyAmount | null;
  lineTotal: CurrencyAmount | null;
  isAvailable: boolean;
}

export type CartItemsTableResponse = TableResponse<CartLineData>;

export interface CartLinesData {
  currencyCode: string;
  items: CartLineData[];
  subtotal: CurrencyAmount;
  itemCount: number;
}

// Opening a basket. Every basket belongs to a shopper
export const openCartSchema = z.object({
  partyId: z.uuid('Choose a shopper'),
});

export const addCartLineSchema = z.object({
  offeringVariantId: z.uuid('Choose a variant'),
  quantity: zodNumericField({
    required: 'How many?',
    integer: true,
    min: 1,
    minMessage: 'At least one',
    max: 99,
    maxMessage: 'At most 99',
  }),
});

export type OpenCartFormData = z.infer<typeof openCartSchema>;
export type AddCartLineFormData = z.infer<typeof addCartLineSchema>;

// The offering scopes the variant picker but is never submitted — a variant carries its own offering
export const addCartLineFormSchema = addCartLineSchema.extend({
  offeringId: z.uuid('Choose a product'),
});

export type AddCartLineFormShape = z.infer<typeof addCartLineFormSchema>;
