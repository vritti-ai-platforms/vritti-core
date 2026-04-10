import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUomDto {
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
}
