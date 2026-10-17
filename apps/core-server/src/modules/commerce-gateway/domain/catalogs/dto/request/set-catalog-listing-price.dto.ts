import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';

export class SetCatalogListingPriceDto {
  @ApiProperty({ type: CurrencyAmountDto, example: { currency: 'INR', value: '115.00' } })
  @IsCurrency()
  price: CurrencyAmountDto;
}
