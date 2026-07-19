import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'The party (COMPANY or PERSON) this supplier represents' })
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

  @ApiPropertyOptional({ description: 'Block new purchase orders for this supplier', default: false })
  @IsOptional()
  @IsBoolean()
  purchasingBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Block payments to this supplier', default: false })
  @IsOptional()
  @IsBoolean()
  paymentBlocked?: boolean;

  @Trim()
  @ApiPropertyOptional({ description: 'Email for sending purchase orders', example: 'orders@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  orderEmail?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Phone for order communication', example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  orderPhone?: string | null;

  @ApiPropertyOptional({ description: 'Whether supplier is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
