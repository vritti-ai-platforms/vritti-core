import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'Business unit ID this item belongs to' })
  @IsUUID()
  businessUnitId: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Item type', enum: ['PRODUCT', 'SERVICE'] })
  @IsEnum(['PRODUCT', 'SERVICE'])
  type: string;

  @ApiPropertyOptional({ description: 'Item code (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Base price', example: 10.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Cost price', example: 5.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Tax group ID' })
  @IsOptional()
  @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'Whether the item is available', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Whether the item is visible', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Whether to track inventory', default: false })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
