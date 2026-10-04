import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class SetCatalogListingPriceDto {
  @IsUUID('7')
  catalogListingId: string;

  @IsCurrency()
  price: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('7')
  siteId?: string | null;
}
