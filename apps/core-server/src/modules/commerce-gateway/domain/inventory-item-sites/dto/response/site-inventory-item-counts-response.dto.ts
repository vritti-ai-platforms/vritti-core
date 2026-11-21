import { ApiProperty } from '@nestjs/swagger';

export class SiteInventoryItemCountsResponseDto {
  @ApiProperty({ description: 'Locations at the site holding stock of the item or set up for it', example: 3 })
  stockLevelCount: number;

  @ApiProperty({ description: 'Lots of the item', example: 5 })
  lotCount: number;

  @ApiProperty({ description: 'Locations set up for the item at the site', example: 2 })
  locationCount: number;

  @ApiProperty({ description: 'Supplier items carrying the item', example: 4 })
  supplierCount: number;

  @ApiProperty({ description: "Price rows for the item at the site, the legal entity's included", example: 12 })
  priceCount: number;

  @ApiProperty({ description: 'Stock movements of the item at the site', example: 40 })
  movementCount: number;

  @ApiProperty({ description: 'Quants of the item at the site', example: 6 })
  quantCount: number;
}
