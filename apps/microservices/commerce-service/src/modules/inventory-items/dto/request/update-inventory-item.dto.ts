import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { InventoryItemType } from '@/db/schema';

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsEnum(['MATERIAL', 'PRODUCT'])
  type?: InventoryItemType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  uomId?: string;

  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;
}
