import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CancelUnpaidOrderDto {
  @IsUUID()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  // The payment intent whose expiry triggers the cancel.
  // The payment intent whose expiry triggers the cancel. An order already bound to a different intent is left as is
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;
}
