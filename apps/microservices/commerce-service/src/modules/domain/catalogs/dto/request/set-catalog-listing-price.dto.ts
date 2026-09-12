import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class SetCatalogListingPriceDto {
  @IsUUID('all')
  catalogListingId: string;

  @IsCurrency()
  price: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('all')
  siteId?: string | null;
}
