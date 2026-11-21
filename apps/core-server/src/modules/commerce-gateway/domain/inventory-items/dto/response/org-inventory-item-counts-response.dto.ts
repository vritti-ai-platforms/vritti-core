import { ApiProperty } from '@nestjs/swagger';

export class OrgInventoryItemCountsResponseDto {
  @ApiProperty({ description: 'Per-item UOM conversions of the item', example: 2 })
  conversionCount: number;

  @ApiProperty({ description: 'MRPs recorded for the item, across units and currencies', example: 3 })
  mrpCount: number;

  @ApiProperty({ description: 'Supplier items carrying the item, across every supplier', example: 4 })
  supplierCount: number;
}
