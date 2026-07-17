import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { InventoryItemType, InventoryPickStrategy } from '@/db/schema';

export class UpdateInventoryItemDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @IsCode()
  code?: string;

  @IsOptional()
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type?: InventoryItemType;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Trim()
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
  taxClassId?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
