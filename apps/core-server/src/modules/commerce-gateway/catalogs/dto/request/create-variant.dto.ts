import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class VariantComponentInput {
  @ApiProperty({ description: 'Inventory item ID drawn down by this variant' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity of the inventory item (in its stocking UOM)', example: 1 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateVariantDto {
  @ApiProperty({ description: 'Selected option value IDs (empty when the offering has no options)', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  optionValueIds: string[];

  @ApiPropertyOptional({
    description: 'Inventory components (required for STOCK/COMPOSITE, none for SERVICE)',
    type: [VariantComponentInput],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantComponentInput)
  components?: VariantComponentInput[];

  @ApiProperty({ type: CurrencyAmountDto, description: 'Variant price in the catalog currency (major units)' })
  @IsCurrency()
  price: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Whether the variant is available', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'SKU code (auto-derived when omitted)' })
  @IsOptional()
  @IsString()
  sku?: string;
}
