import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  type InventoryItemType,
  type InventoryPickStrategy,
  InventoryPickStrategyValues,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/db/schema';

export class CreateInventoryItemDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsCode()
  sku: string;

  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type: InventoryItemType;

  @IsEnum(InventoryTrackingValues)
  tracking: InventoryTracking;

  @IsEnum(InventoryPickStrategyValues)
  @IsOptional()
  pickStrategy?: InventoryPickStrategy;

  @IsUUID('7')
  categoryId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsUUID('7')
  uomId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @IsUUID('7')
  taxClassId: string;
}
