import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { VariantComponentInput } from './create-variant.dto';

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsCurrency()
  price?: CurrencyAmountDto;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantComponentInput)
  components?: VariantComponentInput[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
