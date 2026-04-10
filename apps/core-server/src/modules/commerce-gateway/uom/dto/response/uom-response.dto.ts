import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UomResponseDto {
  @ApiProperty({ description: 'UOM ID' })
  id: string;

  @ApiProperty({ description: 'Unit name', example: 'Kilogram' })
  name: string;

  @ApiProperty({ description: 'Unit symbol', example: 'kg' })
  symbol: string;

  @ApiPropertyOptional({ description: 'Base unit ID', nullable: true })
  baseUnitId: string | null;

  @ApiPropertyOptional({ description: 'Base unit symbol', nullable: true, example: 'g' })
  baseUnitSymbol: string | null;

  @ApiProperty({ description: 'Conversion factor to base unit', example: 1000 })
  conversionFactor: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
