import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { VariantComponentInput } from './create-variant.dto';

export class DefaultVariantInput {
  @ApiPropertyOptional({ description: 'SKU code (auto-derived when omitted)' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Variant price in the catalog currency (major units)' })
  @IsCurrency()
  price: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Whether the variant is available', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Inventory components (required for STOCK/COMPOSITE, none for SERVICE)',
    type: [VariantComponentInput],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantComponentInput)
  components?: VariantComponentInput[];
}

export class CreateOfferingDto {
  @ApiProperty({ description: 'Catalog ID this offering belongs to' })
  @IsUUID()
  @IsNotEmpty()
  catalogId: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Fulfilment type', enum: ['STOCK', 'SERVICE', 'COMPOSITE'] })
  @IsEnum(['STOCK', 'SERVICE', 'COMPOSITE'])
  fulfilmentType: string;

  @ApiProperty({ description: 'Offering name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Offering description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Sales tax group ID' })
  @IsUUID()
  salesTaxGroupId: string;

  @ApiPropertyOptional({ description: 'Whether the offering is available', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Variant option IDs that form the offering axes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  variantOptionIds?: string[];

  @ApiPropertyOptional({
    description: 'Default variant created at offering creation (single-variant types only)',
    type: DefaultVariantInput,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultVariantInput)
  defaultVariant?: DefaultVariantInput;
}
