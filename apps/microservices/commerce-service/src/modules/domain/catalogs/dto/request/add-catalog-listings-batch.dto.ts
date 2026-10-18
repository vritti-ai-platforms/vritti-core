import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class AddCatalogListingItemDto {
  @IsUUID('7')
  offeringVariantId: string;

  @IsOptional()
  @IsUUID('7')
  inventoryItemMrpId?: string | null;

  @IsOptional()
  @Type(() => CurrencyAmountDto)
  @IsCurrency()
  price?: CurrencyAmountDto;
}

export class AddCatalogListingsBatchDto {
  @IsUUID('7')
  catalogId: string;

  @IsOptional()
  @IsUUID('7')
  legalEntityId?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddCatalogListingItemDto)
  items: AddCatalogListingItemDto[];
}
