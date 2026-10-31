import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  type InventoryItemType,
  type InventoryPickStrategy,
  InventoryPickStrategyValues,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/db/schema';

export class CreateVariantInventoryItemDto {
  @IsUUID('7')
  variantId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: InventoryItemType;

  @IsEnum(InventoryTrackingValues)
  tracking: InventoryTracking;

  @IsEnum(InventoryPickStrategyValues)
  @IsOptional()
  pickStrategy?: InventoryPickStrategy;

  @IsUUID('7')
  categoryId: string;

  @IsUUID('7')
  uomId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
