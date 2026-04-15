import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Item name', example: 'Basmati Rice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Item code', example: 'RAW-RICE-BAS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code: string;

  @ApiProperty({ description: 'Item type', enum: ['MATERIAL', 'PRODUCT'] })
  @IsEnum(['MATERIAL', 'PRODUCT'])
  type: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Unit of measure ID' })
  @IsUUID()
  uomId: string;
}
