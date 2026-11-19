import { ApiProperty } from '@nestjs/swagger';

export class DisplayUomQuantityResponseDto {
  @ApiProperty({ description: "The quantity in the item's primary unit, as stored", example: 2344 })
  primaryUomQty: number;

  @ApiProperty({ description: "The quantity in the item's display unit", example: 234.4 })
  displayUomQty: number;

  @ApiProperty({ description: 'Whole display units in it, toward zero', example: 234 })
  wholeDisplayUomQty: number;

  @ApiProperty({ description: 'Primary units left over after the whole display units', example: 4 })
  remainderPrimaryUomQty: number;

  @ApiProperty({ example: 'strip' })
  displayUomSymbol: string;

  @ApiProperty({ example: 'tab' })
  primaryUomSymbol: string;

  @ApiProperty({ description: "Whether the display unit is one of the item's own pack conversions" })
  isPack: boolean;
}
