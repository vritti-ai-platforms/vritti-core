import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Updated supplier name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated supplier code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Updated supplier currency code (ISO 4217)' })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Updated mailing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Updated supplier website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'Updated Tax ID' })
  @ValidateIf((o: UpdateSupplierDto) => o.taxId !== null || o.taxIdType != null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Updated tax ID type', enum: ['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'] })
  @ValidateIf((o: UpdateSupplierDto) => o.taxId != null && String(o.taxId).trim().length > 0)
  @IsEnum(['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'])
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER';

  @ApiPropertyOptional({ description: 'Updated payment terms' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Updated lead time in days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether supplier is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
