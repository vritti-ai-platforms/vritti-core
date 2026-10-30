import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'The party (COMPANY or PERSON) this supplier represents' })
  @IsUUID('7')
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

  @ApiPropertyOptional({
    type: [String],
    description: 'Further currencies the supplier trades in; the default is always included',
    example: ['USD'],
  })
  @IsOptional()
  @IsArray()
  @IsCurrencyCode({ each: true })
  currencyCodes?: string[];

  @ApiPropertyOptional({ description: 'Payment term new site enrollments start from', nullable: true })
  @IsOptional()
  @IsUUID('7')
  defaultPaymentTermId?: string | null;

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
