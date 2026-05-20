import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Conversion factor to base unit', default: 1, example: 1000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionFactor?: number;

  @ApiPropertyOptional({ description: 'Whether this unit allows decimal quantities', default: false })
  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;
}
