import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PAYMENT_TERM_BASELINES, type PaymentTermBaseline } from '../response/payment-term-response.dto';

export class UpdatePaymentTermDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Human-readable name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Date the due days count from; only a draft may change it',
    enum: PAYMENT_TERM_BASELINES,
  })
  @IsOptional()
  @IsIn(PAYMENT_TERM_BASELINES)
  baseline?: PaymentTermBaseline;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
