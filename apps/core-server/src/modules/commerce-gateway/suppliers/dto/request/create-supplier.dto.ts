import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';

export class CreatePrimarySupplierContactDto {
  @ApiProperty({ description: 'Primary contact person name', example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Primary contact phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Phone must be a valid international number (e.g. +919876543210).' })
  phone: string;

  @ApiPropertyOptional({ description: 'Primary contact alternate phone number' })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional({ description: 'Primary contact email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Primary contact alternate email address' })
  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @ApiPropertyOptional({ description: 'Primary contact designation' })
  @IsOptional()
  @IsString()
  designation?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

  @ApiProperty({ description: 'Primary contact details', type: CreatePrimarySupplierContactDto })
  @ValidateNested()
  @Type(() => CreatePrimarySupplierContactDto)
  primaryContact: CreatePrimarySupplierContactDto;

  @ApiPropertyOptional({ description: 'Mailing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Supplier website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'Supplier tax ID', example: '22AAAAA0000A1Z5' })
  @ValidateIf((o: CreateSupplierDto) => o.taxIdType != null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Tax ID type', enum: ['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'] })
  @ValidateIf((o: CreateSupplierDto) => o.taxId != null && String(o.taxId).trim().length > 0)
  @IsEnum(['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'])
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER';

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Default lead time in days', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
