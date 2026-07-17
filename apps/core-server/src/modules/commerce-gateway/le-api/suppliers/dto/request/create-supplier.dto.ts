import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'The party (ORGANIZATION or PERSON) this supplier represents' })
  @IsUUID()
  partyId: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string | null;

  @ApiPropertyOptional({ description: 'Default lead time in days', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @Trim()
  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
