import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUomDto {
  @ApiPropertyOptional({ description: 'Updated dimension UUID' })
  @IsOptional()
  @IsUUID()
  dimensionId?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Updated unit name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @Trim({ nullify: false })
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

  @ApiPropertyOptional({ description: 'Updated count of dimension base UOM units in the ratio' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  baseUomQty?: number;

  @ApiPropertyOptional({ description: 'Updated count of this UOM in the ratio' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  uomQty?: number;
}
