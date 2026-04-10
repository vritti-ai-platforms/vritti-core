import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Tax group ID' })
  @IsOptional()
  @IsUUID()
  taxGroupId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the item is available' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
