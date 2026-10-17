import { ApiProperty } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';

export class AddCatalogCurrencyDto {
  @ApiProperty({ example: 'USD' })
  @IsCurrencyCode()
  currencyCode: string;
}
