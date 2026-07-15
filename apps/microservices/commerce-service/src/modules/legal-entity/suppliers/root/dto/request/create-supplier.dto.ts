import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreatePrimarySupplierContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Phone must be a valid international number (e.g. +919876543210).' })
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alternateEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

  @ValidateNested()
  @Type(() => CreatePrimarySupplierContactDto)
  primaryContact: CreatePrimarySupplierContactDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ValidateIf((o: CreateSupplierDto) => o.taxIdType != null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  taxId?: string;

  @ValidateIf((o: CreateSupplierDto) => o.taxId != null && String(o.taxId).trim().length > 0)
  @IsEnum(['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'])
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
