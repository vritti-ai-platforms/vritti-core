import { IsISO8601, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class MarkOrderPaidDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  method?: string;

  // The payment provider's own id for the captured payment
  @IsOptional()
  @IsString()
  @MaxLength(100)
  providerPaymentId?: string;

  // Minor units as a decimal string, so it survives JSON without a float
  @Matches(/^\d+$/, { message: 'amountMinor must be a non-negative integer string' })
  amountMinor: string;

  // ISO 4217. The currency the payment was captured in; must match the order's
  @IsString()
  @Length(3, 3)
  currency: string;

  @IsISO8601()
  paidAt: string;
}
