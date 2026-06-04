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
  @IsUUID()
  inventoryItemId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateVariantDto {
  @IsUUID()
  offeringId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  optionValueIds: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantComponentInput)
  components?: VariantComponentInput[];

  @IsCurrency()
  price: CurrencyAmountDto;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  sku?: string;
}
