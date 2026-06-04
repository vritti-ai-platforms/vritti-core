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
import type { FulfilmentType } from '@/db/schema';
import { VariantComponentInput } from './create-variant.dto';

export class DefaultVariantInput {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsCurrency()
  price: CurrencyAmountDto;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantComponentInput)
  components?: VariantComponentInput[];
}

export class CreateOfferingDto {
  @IsUUID()
  @IsNotEmpty()
  catalogId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsEnum(['STOCK', 'SERVICE', 'COMPOSITE'])
  fulfilmentType: FulfilmentType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  salesTaxGroupId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  variantOptionIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultVariantInput)
  defaultVariant?: DefaultVariantInput;
}
