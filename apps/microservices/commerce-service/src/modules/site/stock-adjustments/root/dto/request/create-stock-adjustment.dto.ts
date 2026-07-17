import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { type StockAdjustmentType, StockAdjustmentTypeValues } from '@/db/schema';

export class CreateStockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsIn(Object.values(StockAdjustmentTypeValues))
  type: StockAdjustmentType;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  unitCost?: string;
}
