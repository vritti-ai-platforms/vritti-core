import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UomResponseDto {
  @ApiProperty({ description: 'UOM ID' })
  id: string;

  @ApiProperty({ description: 'Dimension UUID this UOM belongs to' })
  dimensionId: string;

  @ApiProperty({ description: 'Unit name', example: 'Kilogram' })
  name: string;

  @ApiProperty({ description: 'Unit symbol', example: 'kg' })
  symbol: string;

  @ApiPropertyOptional({ description: 'Base unit ID', nullable: true })
  baseUnitId: string | null;

  @ApiPropertyOptional({ description: 'Base unit symbol (joined from referenced UOM)', nullable: true })
  baseUnitSymbol: string | null;

  @ApiProperty({ description: 'Count of dimension base UOM units in the ratio. 1 Box = 12 Each → baseUomQty=12.', example: 12 })
  baseUomQty: number;

  @ApiProperty({ description: 'Count of this UOM in the ratio. 1 Box = 12 Each → uomQty=1.', example: 1 })
  uomQty: number;

  @ApiProperty({ description: 'Whether this UOM is editable by the current BU' })
  canEdit: boolean;

  @ApiProperty({ description: 'Whether this UOM can be deleted' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
