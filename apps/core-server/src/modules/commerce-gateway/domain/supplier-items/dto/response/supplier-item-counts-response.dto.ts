import { ApiProperty } from '@nestjs/swagger';

export class SupplierItemCountsResponseDto {
  @ApiProperty({ description: 'Sites the supplier item is set up at, as far as the workspace reads them', example: 3 })
  siteItemCount: number;

  @ApiProperty({
    description: "Price rows on the supplier item's timeline, as far as the workspace reads them",
    example: 8,
  })
  priceCount: number;
}
