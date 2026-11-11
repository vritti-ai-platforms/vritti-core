import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PaymentChannelType, PaymentIntent, PaymentIntentCustomer, PaymentIntentStatus } from '@/db/schema';

export class PaymentIntentDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  partyId: string | null;
  reference: { type: string; id: string };
  // The commerce checkout this payment pays for, when it pays one
  // The record this payment settles: a checkout, a point-of-sale sale
  targetId: string | null;
  description: string | null;
  configId: string;
  gatewayCode: string;
  type: PaymentChannelType;
  idempotencyKey: string;
  receipt: string;
  amount: CurrencyAmountDto;
  fee: CurrencyAmountDto;
  tax: CurrencyAmountDto;
  status: PaymentIntentStatus;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  // What the browser needs to open the gateway's page or popup, null until the gateway order exists
  launch: Record<string, unknown> | null;
  method: string | null;
  customer: PaymentIntentCustomer | null;
  metadata: Record<string, string> | null;
  returnUrl: string | null;
  // Where the shopper goes back to after a failed or cancelled payment
  retryUrl: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  succeededAt: Date | null;
  refundedAt: Date | null;
  // The gateway's id for the refund
  refundReference: string | null;
  // Why the gateway refused the last refund
  refundFailureMessage: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static from(entity: PaymentIntent): PaymentIntentDto {
    const dto = new PaymentIntentDto();
    dto.id = entity.id;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.appId = entity.appId ?? null;
    dto.partyId = entity.partyId ?? null;
    dto.reference = { type: entity.referenceType, id: entity.referenceId };
    dto.targetId = entity.targetId ?? null;
    dto.description = entity.description ?? null;
    dto.configId = entity.configId;
    dto.gatewayCode = entity.gatewayCode;
    dto.type = entity.type;
    dto.idempotencyKey = entity.idempotencyKey;
    dto.receipt = entity.receipt;
    dto.amount = CurrencyAmountDto.from(entity.amount, entity.currency);
    dto.fee = CurrencyAmountDto.from(entity.fee ?? 0n, entity.currency);
    dto.tax = CurrencyAmountDto.from(entity.tax ?? 0n, entity.currency);
    dto.status = entity.status;
    dto.providerOrderId = entity.providerOrderId ?? null;
    dto.providerPaymentId = entity.providerPaymentId ?? null;
    dto.launch = entity.launch ?? null;
    dto.method = entity.method ?? null;
    dto.customer = entity.customer ?? null;
    dto.metadata = entity.metadata ?? null;
    dto.returnUrl = entity.returnUrl ?? null;
    dto.retryUrl = entity.retryUrl ?? null;
    dto.failureCode = entity.failureCode ?? null;
    dto.failureMessage = entity.failureMessage ?? null;
    dto.succeededAt = entity.succeededAt ?? null;
    dto.refundedAt = entity.refundedAt ?? null;
    dto.refundReference = entity.refundReference ?? null;
    dto.refundFailureMessage = entity.refundFailureMessage ?? null;
    dto.expiresAt = entity.expiresAt ?? null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
