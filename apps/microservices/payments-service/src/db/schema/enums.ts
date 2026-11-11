import { paymentsSchema } from './payments-schema';

export const paymentIntentStatusEnum = paymentsSchema.enum('payment_intent_status', [
  'CREATED',
  'REQUIRES_ACTION',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'EXPIRED',
  'REFUND_PENDING',
  'REFUNDED',
  'REFUND_FAILED',
]);
export const webhookEventStatusEnum = paymentsSchema.enum('webhook_event_status', [
  'RECEIVED',
  'PROCESSED',
  'IGNORED',
  'FAILED',
]);
export const paymentChannelTypeEnum = paymentsSchema.enum('payment_channel_type', ['APP', 'POS', 'B2B']);
export const paymentEventStatusEnum = paymentsSchema.enum('payment_event_status', ['PENDING', 'ACKED']);

export type PaymentIntentStatus = (typeof paymentIntentStatusEnum.enumValues)[number];
export type WebhookEventStatus = (typeof webhookEventStatusEnum.enumValues)[number];
export type PaymentChannelType = (typeof paymentChannelTypeEnum.enumValues)[number];
export type PaymentEventStatus = (typeof paymentEventStatusEnum.enumValues)[number];

export const PaymentIntentStatusValues = {
  CREATED: 'CREATED' as const,
  REQUIRES_ACTION: 'REQUIRES_ACTION' as const,
  PROCESSING: 'PROCESSING' as const,
  SUCCEEDED: 'SUCCEEDED' as const,
  FAILED: 'FAILED' as const,
  CANCELED: 'CANCELED' as const,
  EXPIRED: 'EXPIRED' as const,
  REFUND_PENDING: 'REFUND_PENDING' as const,
  REFUNDED: 'REFUNDED' as const,
  REFUND_FAILED: 'REFUND_FAILED' as const,
};
export const WebhookEventStatusValues = {
  RECEIVED: 'RECEIVED' as const,
  PROCESSED: 'PROCESSED' as const,
  IGNORED: 'IGNORED' as const,
  FAILED: 'FAILED' as const,
};
export const PaymentChannelTypeValues = {
  APP: 'APP' as const,
  POS: 'POS' as const,
  B2B: 'B2B' as const,
};
export const PaymentEventStatusValues = {
  PENDING: 'PENDING' as const,
  ACKED: 'ACKED' as const,
};

// What a payment event reports, as the owner of the reference receives it
export const PaymentEventTypeValues = {
  SUCCEEDED: 'payment_intent.succeeded' as const,
  PAYMENT_FAILED: 'payment_intent.payment_failed' as const,
  EXPIRED: 'payment_intent.expired' as const,
  CANCELED: 'payment_intent.canceled' as const,
  REFUND_PENDING: 'payment_intent.refund_pending' as const,
  REFUNDED: 'payment_intent.refunded' as const,
  REFUND_FAILED: 'payment_intent.refund_failed' as const,
};
export type PaymentEventType = (typeof PaymentEventTypeValues)[keyof typeof PaymentEventTypeValues];
