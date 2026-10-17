import { ApiProperty } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';

export class ClearCatalogListingPriceQueryDto {
  @ApiProperty({ example: 'INR' })
  @IsCurrencyCode()
  currencyCode: string;
}
