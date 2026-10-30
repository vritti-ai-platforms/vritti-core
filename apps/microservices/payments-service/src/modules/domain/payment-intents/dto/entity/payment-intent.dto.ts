import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PaymentChannelType, PaymentIntent, PaymentIntentCustomer, PaymentIntentStatus } from '@/db/schema';

export class PaymentIntentDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  partyId: string | null;
  reference: { type: string; id: string };
  description: string | null;
  configId: string;
  gatewayCode: string;
  bankAccountId: string | null;
  type: PaymentChannelType;
  idempotencyKey: string;
  receipt: string;
  amount: CurrencyAmountDto;
  fee: CurrencyAmountDto;
  tax: CurrencyAmountDto;
  status: PaymentIntentStatus;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  // Public launch data for the gateway's checkout, null until the gateway order exists
  checkout: Record<string, unknown> | null;
  method: string | null;
  customer: PaymentIntentCustomer | null;
  metadata: Record<string, string> | null;
  returnUrl: string | null;
  checkoutUrl: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  succeededAt: Date | null;
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
    dto.description = entity.description ?? null;
    dto.configId = entity.configId;
    dto.gatewayCode = entity.gatewayCode;
    dto.bankAccountId = entity.bankAccountId ?? null;
    dto.type = entity.type;
    dto.idempotencyKey = entity.idempotencyKey;
    dto.receipt = entity.receipt;
    dto.amount = CurrencyAmountDto.from(entity.amount, entity.currency);
    dto.fee = CurrencyAmountDto.from(entity.fee ?? 0n, entity.currency);
    dto.tax = CurrencyAmountDto.from(entity.tax ?? 0n, entity.currency);
    dto.status = entity.status;
    dto.providerOrderId = entity.providerOrderId ?? null;
    dto.providerPaymentId = entity.providerPaymentId ?? null;
    dto.checkout = entity.checkout ?? null;
    dto.method = entity.method ?? null;
    dto.customer = entity.customer ?? null;
    dto.metadata = entity.metadata ?? null;
    dto.returnUrl = entity.returnUrl ?? null;
    dto.checkoutUrl = entity.checkoutUrl ?? null;
    dto.failureCode = entity.failureCode ?? null;
    dto.failureMessage = entity.failureMessage ?? null;
    dto.succeededAt = entity.succeededAt ?? null;
    dto.expiresAt = entity.expiresAt ?? null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
