import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { VariantComponentInput } from './create-variant.dto';

export class UpdateVariantDto {
  @ApiPropertyOptional({ description: 'Updated SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Updated variant name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Updated variant price (catalog currency, major units)',
  })
  @IsOptional()
  @IsCurrency()
  price?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Whether the variant is available' })
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

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
