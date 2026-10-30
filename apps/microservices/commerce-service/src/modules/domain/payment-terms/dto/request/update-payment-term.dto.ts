import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { type PaymentTermBaseline, paymentTermBaselineEnum } from '@/db/schema';

export class UpdatePaymentTermDto {
  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(paymentTermBaselineEnum.enumValues)
  baseline?: PaymentTermBaseline;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
