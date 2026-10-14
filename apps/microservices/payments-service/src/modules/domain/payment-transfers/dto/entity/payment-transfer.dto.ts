import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PaymentTransfer, PaymentTransferStatus } from '@/db/schema';

export class PaymentTransferDto {
  id: string;
  intentId: string;
  linkedAccountId: string;
  providerAccountId: string;
  amount: CurrencyAmountDto;
  onHold: boolean;
  onHoldUntil: Date | null;
  status: PaymentTransferStatus;
  providerTransferId: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  createdAt: Date;
  updatedAt: Date;

  static from(entity: PaymentTransfer): PaymentTransferDto {
    const dto = new PaymentTransferDto();
    dto.id = entity.id;
    dto.intentId = entity.intentId;
    dto.linkedAccountId = entity.linkedAccountId;
    dto.providerAccountId = entity.providerAccountId;
    dto.amount = CurrencyAmountDto.from(entity.amount, entity.currency);
    dto.onHold = entity.onHold;
    dto.onHoldUntil = entity.onHoldUntil ?? null;
    dto.status = entity.status;
    dto.providerTransferId = entity.providerTransferId ?? null;
    dto.errorCode = entity.errorCode ?? null;
    dto.errorDescription = entity.errorDescription ?? null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
