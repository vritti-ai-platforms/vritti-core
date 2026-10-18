import type { OrderType } from '@/db/schema';

export interface AwaitingPaymentOrderLine {
  offeringId: string;
  offeringVariantId: string;
  name: string;
  code: string | null;
  quantity: number;
  unitPrice: bigint;
}

export interface AwaitingPaymentOrderInput {
  partyId: string;
  currencyCode: string;
  type: OrderType;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  checkoutKey: string | null;
  lines: AwaitingPaymentOrderLine[];
}
