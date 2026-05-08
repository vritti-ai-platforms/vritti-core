import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import type { InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code: string;

  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: InventoryItemType;

  @IsEnum(['quantity', 'lot', 'lot_serial', 'serial'])
  tracking: InventoryTracking;

  @IsEnum(['none', 'fifo', 'fefo'])
  @IsOptional()
  pickStrategy?: InventoryPickStrategy;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  uomId: string;
}
