import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { TaxRegimeValues } from '@/db/schema';

export class CreateLegalEntityInternalDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Legal entity code (unique per organization)', example: 'acme-india' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Legal entity name', example: 'Acme Pharma Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Country (ISO 3166-1 alpha-2)', example: 'IN' })
  @IsString()
  @Length(2, 2)
  country: string;

  @ApiProperty({ description: 'Base currency (ISO 4217)', example: 'INR' })
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  @ApiProperty({ description: 'Tax regime', enum: ['GST', 'VAT', 'SALES_TAX', 'NONE'], example: 'GST' })
  @IsEnum(TaxRegimeValues)
  taxRegime: string;

  @ApiPropertyOptional({ description: 'Entity-level tax identifier (PAN, CR number)', example: 'AAACA1234F' })
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
}
