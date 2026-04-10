import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateUomDto {
  @ApiPropertyOptional({ description: 'Updated unit name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated unit symbol' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({ description: 'Updated base unit ID (null = this is a base unit)' })
  @IsOptional()
  @IsUUID()
  baseUnitId?: string | null;

  @ApiPropertyOptional({ description: 'Updated conversion factor' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  conversionFactor?: number;
}
