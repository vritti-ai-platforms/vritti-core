import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class UpdateBomLineDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Required quantity per unit' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity: number;
}

export class UpdateBomDto {
  @ApiPropertyOptional({ description: 'BOM name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'BOM code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ description: 'Whether BOM is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'BOM lines (replaces all)', type: [UpdateBomLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBomLineDto)
  lines?: UpdateBomLineDto[];
}
