import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { InventoryItemType } from '@/db/schema';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsEnum(['MATERIAL', 'PRODUCT'])
  type: InventoryItemType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  uomId: string;
}
