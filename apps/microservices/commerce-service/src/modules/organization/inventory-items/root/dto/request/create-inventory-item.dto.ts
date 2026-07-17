import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

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

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsUUID()
  uomId: string;

  @IsUUID()
  taxClassId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
