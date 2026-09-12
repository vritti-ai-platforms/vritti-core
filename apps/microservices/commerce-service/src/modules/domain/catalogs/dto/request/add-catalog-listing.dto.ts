import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class AddCatalogListingDto {
  @IsUUID('all')
  catalogId: string;

  @IsUUID('all')
  offeringVariantId: string;

  @IsOptional()
  @IsUUID('all')
  legalEntityId?: string | null;

  @IsOptional()
  @IsUUID('all')
  inventoryItemMrpId?: string | null;

  @IsOptional()
  @IsCurrency()
  price?: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;
}
