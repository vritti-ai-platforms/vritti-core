import type { PaymentGatewayConfigType } from '@/db/schema';

export const PaymentIntentStatusValues = {
  CREATED: 'CREATED',
  REQUIRES_ACTION: 'REQUIRES_ACTION',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;
export type PaymentIntentStatusValue = (typeof PaymentIntentStatusValues)[keyof typeof PaymentIntentStatusValues];

export interface PaymentMoneyResponseDto {
  currency: string;
  value: string;
}

export interface PaymentIntentResponseDto {
  id: string;
  legalEntityId: string;
  siteId: string | null;
  appId: string | null;
  partyId: string | null;
  reference: { type: string; id: string };
  description: string | null;
  configId: string;
  gatewayCode: string;
  bankAccountId: string;
  type: PaymentGatewayConfigType;
  idempotencyKey: string;
  receipt: string;
  amount: PaymentMoneyResponseDto;
  fee: PaymentMoneyResponseDto;
  tax: PaymentMoneyResponseDto;
  status: PaymentIntentStatusValue;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  checkout: Record<string, unknown> | null;
  method: string | null;
  customer: { name?: string; email?: string; phone?: string } | null;
  metadata: Record<string, string> | null;
  failureCode: string | null;
  failureMessage: string | null;
  succeededAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
