import type { PaymentChannelType } from '@/db/schema';

export const PaymentIntentStatusValues = {
  CREATED: 'CREATED',
  REQUIRES_ACTION: 'REQUIRES_ACTION',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
  REFUND_FAILED: 'REFUND_FAILED',
} as const;
export type PaymentIntentStatusValue = (typeof PaymentIntentStatusValues)[keyof typeof PaymentIntentStatusValues];

export interface PaymentMoneyResponseDto {
  currency: string;
  value: string;
}

export interface PaymentIntentResponseDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  partyId: string | null;
  reference: { type: string; id: string };
  // The record the payment settles: the commerce checkout for a checkout payment
  targetId?: string | null;
  description: string | null;
  configId: string;
  gatewayCode: string;
  type: PaymentChannelType;
  idempotencyKey: string;
  receipt: string;
  amount: PaymentMoneyResponseDto;
  fee: PaymentMoneyResponseDto;
  tax: PaymentMoneyResponseDto;
  status: PaymentIntentStatusValue;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  // What the browser needs to open the gateway's page or popup
  launch: Record<string, unknown> | null;
  method: string | null;
  customer: { name?: string; email?: string; phone?: string } | null;
  metadata: Record<string, string> | null;
  returnUrl?: string | null;
  // Where the shopper goes back to after a failed or cancelled payment
  retryUrl?: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  succeededAt: string | null;
  refundedAt?: string | null;
  // The gateway's id for the refund, and why it refused the last one
  refundReference?: string | null;
  refundFailureMessage?: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
