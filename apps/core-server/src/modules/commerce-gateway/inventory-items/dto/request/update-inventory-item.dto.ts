import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Item code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code?: string;

  @ApiPropertyOptional({ description: 'Item type', enum: ['MATERIAL', 'PRODUCT'] })
  @IsOptional()
  @IsEnum(['MATERIAL', 'PRODUCT'])
  type?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Unit of measure ID' })
  @IsOptional()
  @IsUUID()
  uomId?: string;
}
