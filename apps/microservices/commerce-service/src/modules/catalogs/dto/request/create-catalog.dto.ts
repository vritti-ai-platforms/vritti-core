import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCatalogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  channelIds?: string[];
}
