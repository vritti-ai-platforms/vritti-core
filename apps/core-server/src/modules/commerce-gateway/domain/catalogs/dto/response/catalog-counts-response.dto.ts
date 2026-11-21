import { ApiProperty } from '@nestjs/swagger';

export class CatalogCountsResponseDto {
  @ApiProperty({ description: 'Channels carrying the catalog', example: 2 })
  channelCount: number;

  @ApiProperty({ description: 'Listings in the catalog whose variant is in reach', example: 48 })
  listingCount: number;

  @ApiProperty({ description: 'Currencies the catalog is priced in', example: 2 })
  currencyCount: number;
}
