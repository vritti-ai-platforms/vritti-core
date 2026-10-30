import type { PaymentMoneyResponseDto } from './payment-intent-response.dto';

export const PaymentEventTypeValues = {
  SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_FAILED: 'payment_intent.payment_failed',
  EXPIRED: 'payment_intent.expired',
  CANCELED: 'payment_intent.canceled',
} as const;

export interface PaymentEventPayloadDto {
  paymentIntentId: string;
  appId: string | null;
  partyId: string | null;
  legalEntityId: string | null;
  siteId: string | null;
  configId: string;
  reference: { type: string; id: string };
  amount: PaymentMoneyResponseDto;
  method: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  failure: { code: string | null; message: string | null } | null;
  metadata: Record<string, string> | null;
  late?: boolean;
}

export interface PaymentEventResponseDto {
  id: string;
  intentId: string;
  type: string;
  payload: PaymentEventPayloadDto;
  createdAt: string;
}
