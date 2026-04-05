import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateItemDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'Updated item type', enum: ['PRODUCT', 'SERVICE'] })
  @IsOptional()
  @IsEnum(['PRODUCT', 'SERVICE'])
  type?: string;

  @ApiPropertyOptional({ description: 'Updated item name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Updated base price', example: 10.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Updated cost price', example: 5.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number | null;

  @ApiPropertyOptional({ description: 'Tax group ID' })
  @IsOptional()
  @IsUUID()
  taxGroupId?: string | null;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string | null;

  @ApiPropertyOptional({ description: 'Whether the item is available' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Whether the item is visible' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Whether to track inventory' })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
