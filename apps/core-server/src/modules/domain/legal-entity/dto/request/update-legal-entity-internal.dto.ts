import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCountry } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { TaxRegimeValues } from '@/db/schema';

export class UpdateLegalEntityInternalDto {
  @ApiPropertyOptional({ example: 'acme-india' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ example: 'Acme Pharma Pvt Ltd' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Country (ISO 3166-1 alpha-2)', example: 'IN' })
  @IsOptional()
  @IsString()
  @IsCountry()
  country?: string;

  @ApiPropertyOptional({ description: 'Base currency (ISO 4217)', example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ enum: ['GST', 'VAT', 'SALES_TAX', 'NONE'], example: 'GST' })
  @IsOptional()
  @IsEnum(TaxRegimeValues)
  taxRegime?: string;

  @ApiPropertyOptional({ example: 'AAACA1234F' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Fiscal year start month (1-12)', example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number;

  @ApiPropertyOptional({ description: 'Parent legal entity ID (subsidiary)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order in the org-structure graph (lower sorts first)', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
