import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency code must be a valid 3-letter ISO code.' })
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @ValidateIf((o: UpdateSupplierDto) => o.taxId !== null || o.taxIdType != null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  taxId?: string | null;

  @ValidateIf((o: UpdateSupplierDto) => o.taxId != null && String(o.taxId).trim().length > 0)
  @IsEnum(['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'])
  taxIdType?: 'GST' | 'VAT' | 'EIN' | 'SALES_TAX' | 'OTHER' | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
