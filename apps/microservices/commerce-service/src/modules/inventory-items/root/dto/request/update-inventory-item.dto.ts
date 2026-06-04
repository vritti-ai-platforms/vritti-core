import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import type { InventoryItemType, InventoryPickStrategy } from '@/db/schema';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code?: string;

  @IsOptional()
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type?: InventoryItemType;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  uomId?: string;

  @IsEnum(['none', 'fifo', 'fefo'])
  @IsOptional()
  pickStrategy?: InventoryPickStrategy;

  @IsOptional()
  @IsUUID()
  purchaseTaxGroupId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
