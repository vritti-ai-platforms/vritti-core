import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength } from 'class-validator';
import { type InventoryItemType, type InventoryPickStrategy, InventoryPickStrategyValues } from '@/db/schema';

const MAX_MEASURE = 999_999_999.999;

export class UpdateInventoryItemDto {
  @IsUUID('7')
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
  sku?: string;

  @IsOptional()
  @IsEnum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'])
  type?: InventoryItemType;

  @IsOptional()
  @IsUUID('7')
  categoryId?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;

  @IsEnum(InventoryPickStrategyValues)
  @IsOptional()
  pickStrategy?: InventoryPickStrategy;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @IsOptional()
  @IsUUID('7')
  taxClassId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  weight?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  volume?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  length?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  width?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  height?: number | null;
}
