import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemUomConversionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiProperty() uomName: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty({ description: 'Count of the item primary UOM in the ratio.' }) primaryUomQty: number;
  @ApiProperty({ description: 'Count of this UOM in the ratio.' }) uomQty: number;
  @ApiProperty({ description: 'Derived: 1 UOM unit = factor primary units.' }) toPrimaryConversionFactor: number;
  @ApiProperty({ description: 'Derived: 1 primary unit = factor UOM units.' }) toUomConversionFactor: number;
  @ApiProperty({
    description:
      'Weight of one pack of this unit, in grams (g); null when not maintained (derived from the primary unit)',
    type: Number,
    nullable: true,
  })
  weight: number | null;
  @ApiProperty({
    description:
      'Volume of one pack of this unit, in millilitres (ml); null when not maintained (derived from the primary unit)',
    type: Number,
    nullable: true,
  })
  volume: number | null;
  @ApiProperty({
    description: 'Length of one pack of this unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  length: number | null;
  @ApiProperty({
    description: 'Width of one pack of this unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  width: number | null;
  @ApiProperty({
    description: 'Height of one pack of this unit, in millimetres (mm); null when not maintained',
    type: Number,
    nullable: true,
  })
  height: number | null;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
