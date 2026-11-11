import { IsInt, IsObject, IsOptional, IsUUID, Max, Min } from 'class-validator';

// Returns a succeeded payment's money to the payer, in full. Credentials come from core, the only holder of the keys
export class RefundPaymentIntentDto {
  @IsUUID()
  paymentIntentId: string;

  @IsObject()
  credentials: Record<string, string>;
}

// The refunds a gateway accepted but has not confirmed, for core's sweep to ask after
export class ListRefundPendingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
