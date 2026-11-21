import { ApiProperty } from '@nestjs/swagger';

export class SupplierCountsResponseDto {
  @ApiProperty({ description: 'Inventory items the supplier sells, one row per item and unit', example: 24 })
  itemCount: number;

  @ApiProperty({
    description: "The legal entity's sites, each listed with the supplier's enrollment there or none",
    example: 3,
  })
  enrollmentCount: number;

  @ApiProperty({ description: "The supplier's quotations of the legal entity and its sites", example: 5 })
  quotationCount: number;

  @ApiProperty({ description: "People linked to the supplier's party (company suppliers only)", example: 2 })
  personCount: number;
}
