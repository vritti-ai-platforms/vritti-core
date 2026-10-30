import type { OrderType } from '@/db/schema';

// One line of a paid order, priced as the checkout froze it
export interface PaidOrderLine {
  offeringId: string;
  offeringVariantId: string;
  name: string;
  code: string | null;
  quantity: number;
  unitPrice: bigint;
}

// An order placed already paid — one store's share of a converted checkout
export interface PaidOrderInput {
  partyId: string;
  currencyCode: string;
  type: OrderType;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  lines: PaidOrderLine[];
  checkoutId: string;
  paymentIntentId: string;
  paidAt: Date;
  paymentMethod: string | null;
  paymentReference: string | null;
  // True when the checkout had been cancelled before its payment landed — the order is flagged for staff review
  needsReview: boolean;
}
