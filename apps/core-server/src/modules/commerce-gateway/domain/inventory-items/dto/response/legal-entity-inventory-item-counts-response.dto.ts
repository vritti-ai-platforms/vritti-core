import { ApiProperty } from '@nestjs/swagger';

export class LegalEntityInventoryItemCountsResponseDto {
  @ApiProperty({ description: "The legal entity's suppliers carrying the item, one per supplier item", example: 4 })
  supplierCount: number;

  @ApiProperty({ description: "The legal entity's sites, whether or not each carries the item", example: 3 })
  siteCount: number;

  @ApiProperty({ description: 'MRPs recorded for the item', example: 2 })
  mrpCount: number;
}
