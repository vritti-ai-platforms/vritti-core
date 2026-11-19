import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemUnitResponseDto {
  @ApiProperty({ description: 'UOM ID' })
  uomId: string;

  @ApiProperty({ example: 'Strip' })
  name: string;

  @ApiProperty({ example: 'strip' })
  symbol: string;

  @ApiProperty({ description: 'Primary units in `uomQty` of this unit', example: 10 })
  primaryUomQty: number;

  @ApiProperty({ description: 'Units of this UOM matching `primaryUomQty` primary units', example: 1 })
  uomQty: number;
}

export class InventoryItemUnitsResponseDto {
  @ApiProperty({ description: "The item's primary unit — quantities are stored in it" })
  primaryUomId: string;

  @ApiProperty({ description: 'The unit the item is displayed in, selected by default when entering a quantity' })
  displayUomId: string;

  @ApiProperty({ type: [InventoryItemUnitResponseDto] })
  units: InventoryItemUnitResponseDto[];
}
