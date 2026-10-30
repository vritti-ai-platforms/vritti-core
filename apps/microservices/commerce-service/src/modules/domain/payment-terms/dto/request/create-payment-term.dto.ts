import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { type PaymentTermBaseline, paymentTermBaselineEnum } from '@/db/schema';

export class CreatePaymentTermDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsIn(paymentTermBaselineEnum.enumValues)
  baseline: PaymentTermBaseline;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
