import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PAYMENT_TERM_BASELINES, type PaymentTermBaseline } from '../response/payment-term-response.dto';

export class CreatePaymentTermDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the org', example: 'net-30' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'Net 30' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Date the due days count from', enum: PAYMENT_TERM_BASELINES })
  @IsIn(PAYMENT_TERM_BASELINES)
  baseline: PaymentTermBaseline;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
