import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class CreateItemDto {
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
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code?: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tax group ID' })
  @IsOptional()
  @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ description: 'Whether the item is available', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
