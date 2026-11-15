import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, Max } from 'class-validator';
import { type StorageCapacityCheck, StorageCapacityCheckValues } from '@/db/schema';

const MAX_MEASURE = 999_999_999.999;

export class StorageTypeFieldsDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  maxWeight?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Up to 3 decimal places' })
  @IsPositive()
  @Max(MAX_MEASURE)
  maxVolume?: number | null;

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

  @IsOptional()
  @IsIn(Object.values(StorageCapacityCheckValues))
  capacityCheck?: StorageCapacityCheck;

  @IsOptional()
  @IsBoolean()
  allowMixedItems?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMixedBatches?: boolean;

  @IsOptional()
  @IsBoolean()
  allowAdditionToStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
