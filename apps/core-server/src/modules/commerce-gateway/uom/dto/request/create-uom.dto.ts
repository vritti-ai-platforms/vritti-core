import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUomDto {
  @ApiProperty({ description: 'Dimension UUID this UOM belongs to' })
  @IsUUID()
  dimensionId: string;

  @ApiProperty({ description: 'Unit name', example: 'Kilogram' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Unit symbol', example: 'kg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @ApiPropertyOptional({ description: 'Base unit ID (null = this is a base unit)' })
  @IsOptional()
  @IsUUID()
  baseUnitId?: string;

  @ApiPropertyOptional({
    description: 'Count of dimension base UOM units in the ratio. Example for 1 Box = 12 Each → baseUomQty=12.',
    default: 1,
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  baseUomQty?: number;

  @ApiPropertyOptional({
    description: 'Count of this UOM in the ratio. Example for 1 Box = 12 Each → uomQty=1.',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  uomQty?: number;

  @ApiPropertyOptional({ description: 'Whether this unit allows decimal quantities', default: false })
  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;
}
