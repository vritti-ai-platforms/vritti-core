import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUomDto {
  @ApiPropertyOptional({ description: 'Updated unit name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated unit symbol' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({ description: 'Updated base unit ID (null = this is a base unit)' })
  @IsOptional()
  @IsUUID()
  baseUnitId?: string | null;

  @ApiPropertyOptional({ description: 'Updated conversion factor' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  conversionFactor?: number;
}
