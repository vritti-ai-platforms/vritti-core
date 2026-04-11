import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  code: string;

  @ApiProperty({ description: 'Item type', enum: ['MATERIAL', 'PRODUCT'] })
  @IsEnum(['MATERIAL', 'PRODUCT'])
  type: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Unit of measure ID' })
  @IsUUID()
  uomId: string;
}
