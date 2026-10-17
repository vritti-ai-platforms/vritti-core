import { ApiProperty } from '@nestjs/swagger';

export class CatalogCurrencyResponseDto {
  @ApiProperty({ example: 'INR' })
  currencyCode: string;

  @ApiProperty({ description: 'Listings this workspace can quote in this currency, its own prices and inherited ones' })
  pricedCount: number;

  @ApiProperty({ description: 'Listings in the catalog, priced or not' })
  listingCount: number;
}
