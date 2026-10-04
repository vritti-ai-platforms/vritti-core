import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class AddCatalogListingDto {
  @IsUUID('7')
  catalogId: string;

  @IsUUID('7')
  offeringVariantId: string;

  @IsOptional()
  @IsUUID('7')
  legalEntityId?: string | null;

  @IsOptional()
  @IsUUID('7')
  inventoryItemMrpId?: string | null;

  @IsOptional()
  @IsCurrency()
  price?: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('7')
  siteId?: string | null;
}
