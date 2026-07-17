import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { VariantComponentInput } from './create-variant.dto';

export class UpdateVariantDto {
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @Trim({ nullify: false })
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

  @IsOptional()
  @IsUUID()
  taxClassId?: string | null;
}

export class UpdateVariantPayloadDto extends UpdateVariantDto {
  @IsUUID()
  variantId: string;
}
