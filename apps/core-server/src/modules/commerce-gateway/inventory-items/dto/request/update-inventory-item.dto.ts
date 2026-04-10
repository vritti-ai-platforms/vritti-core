import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  code?: string;

  @ApiPropertyOptional({ description: 'Item type', enum: ['MATERIAL', 'PRODUCT'] })
  @IsOptional()
  @IsEnum(['MATERIAL', 'PRODUCT'])
  type?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Unit of measure ID' })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ description: 'Requires shipping' })
  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;
}
