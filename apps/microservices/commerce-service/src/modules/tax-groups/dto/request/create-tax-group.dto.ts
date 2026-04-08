import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import type { TaxRateType } from '@/db/schema';

export class CreateTaxRateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;

  @IsEnum(['inclusive', 'exclusive'])
  type: TaxRateType;
}

export class CreateTaxGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaxRateDto)
  taxRates?: CreateTaxRateDto[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
