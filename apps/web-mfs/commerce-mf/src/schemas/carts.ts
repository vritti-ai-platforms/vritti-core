import type { CurrencyAmount } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

/**
 * A basket at this outlet.
 *
 * Every basket belongs to a shopper and to a company. `siteId` is null only on a basket the company
 * itself holds rather than one of its outlets.
 */
export interface CartData {
  id: string;
  siteId: string | null;
  legalEntityId: string;
  partyId: string;
  partyName: string | null;
  channelId: string | null;
  /** Set while a payment is in flight, which is what freezes the basket. */
  checkoutStartedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CartsTableResponse = TableResponse<CartData>;

/** One line. The listing is what this outlet's catalogue offers, resolved per read. */
export interface CartLineData {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  quantity: number;
  name: string;
  sku: string | null;
  unitPrice: CurrencyAmount | null;
  lineTotal: CurrencyAmount | null;
  /** False once delisted, switched off, or no longer priced here. Shown, never silently dropped. */
  isAvailable: boolean;
}

export interface CartLinesData {
  currencyCode: string;
  items: CartLineData[];
  subtotal: CurrencyAmount;
  itemCount: number;
}

/** Opening a basket. Every basket belongs to a shopper. */
export const openCartSchema = z.object({
  partyId: z.string().min(1, 'Choose a shopper'),
});

/**
 * Adding a line.
 *
 * `zodNumericField`, not `z.coerce.number()`: coerce types its *input* as `unknown`, so the resolver
 * and `useForm`'s generic disagree and RHF refuses the resolver.
 */
export const addCartLineSchema = z.object({
  offeringVariantId: z.string().min(1, 'Choose a product'),
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
