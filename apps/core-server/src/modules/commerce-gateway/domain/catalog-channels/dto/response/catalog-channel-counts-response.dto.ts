import { ApiProperty } from '@nestjs/swagger';

export class CatalogChannelCountsResponseDto {
  @ApiProperty({ description: "Listings in the channel's catalog whose variant and offering are active", example: 48 })
  listingCount: number;

  @ApiProperty({ description: "Currencies the channel's catalog is priced in", example: 2 })
  currencyCount: number;
}
