import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsUUID } from 'class-validator';

export class SetCatalogListingPriceDto {
  @IsUUID('7')
  catalogListingId: string;

  @IsCurrency()
  price: CurrencyAmountDto;
}
