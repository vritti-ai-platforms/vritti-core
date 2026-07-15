import { IsCode } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/db/schema';

export class MrpUomConversionDto {
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  uomId: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string;

  @IsOptional()
  @IsBoolean()
  hasMrp?: boolean;

  @IsOptional()
  @IsUUID()
  mrpUomId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MrpUomConversionDto)
  mrpUomConversion?: MrpUomConversionDto;
}
