import { paymentsSchema } from './payments-schema';

export const paymentIntentStatusEnum = paymentsSchema.enum('payment_intent_status', [
  'CREATED',
  'REQUIRES_ACTION',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'EXPIRED',
]);
export const paymentAttemptStatusEnum = paymentsSchema.enum('payment_attempt_status', [
  'CREATED',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
]);
export const webhookEventStatusEnum = paymentsSchema.enum('webhook_event_status', [
  'RECEIVED',
  'PROCESSED',
  'IGNORED',
  'FAILED',
]);
export const paymentChannelTypeEnum = paymentsSchema.enum('payment_channel_type', ['APP', 'POS', 'B2B']);
export const paymentEventStatusEnum = paymentsSchema.enum('payment_event_status', ['PENDING', 'ACKED']);
export const paymentTransferStatusEnum = paymentsSchema.enum('payment_transfer_status', [
  'CREATED',
  'PENDING',
  'PROCESSED',
  'FAILED',
  'REVERSED',
  'PARTIALLY_REVERSED',
]);

export type PaymentIntentStatus = (typeof paymentIntentStatusEnum.enumValues)[number];
export type PaymentAttemptStatus = (typeof paymentAttemptStatusEnum.enumValues)[number];
export type WebhookEventStatus = (typeof webhookEventStatusEnum.enumValues)[number];
export type PaymentChannelType = (typeof paymentChannelTypeEnum.enumValues)[number];
export type PaymentTransferStatus = (typeof paymentTransferStatusEnum.enumValues)[number];
export type PaymentEventStatus = (typeof paymentEventStatusEnum.enumValues)[number];

export const PaymentIntentStatusValues = {
  CREATED: 'CREATED' as const,
  REQUIRES_ACTION: 'REQUIRES_ACTION' as const,
  PROCESSING: 'PROCESSING' as const,
  SUCCEEDED: 'SUCCEEDED' as const,
  FAILED: 'FAILED' as const,
  CANCELED: 'CANCELED' as const,
  EXPIRED: 'EXPIRED' as const,
};
export const PaymentAttemptStatusValues = {
  CREATED: 'CREATED' as const,
  AUTHORIZED: 'AUTHORIZED' as const,
  CAPTURED: 'CAPTURED' as const,
  FAILED: 'FAILED' as const,
  REFUNDED: 'REFUNDED' as const,
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
export const PaymentTransferStatusValues = {
  CREATED: 'CREATED' as const,
  PENDING: 'PENDING' as const,
  PROCESSED: 'PROCESSED' as const,
  FAILED: 'FAILED' as const,
  REVERSED: 'REVERSED' as const,
  PARTIALLY_REVERSED: 'PARTIALLY_REVERSED' as const,
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
};
export type PaymentEventType = (typeof PaymentEventTypeValues)[keyof typeof PaymentEventTypeValues];
