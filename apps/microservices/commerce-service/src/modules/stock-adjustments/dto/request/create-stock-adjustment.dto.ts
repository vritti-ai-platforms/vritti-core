import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  adjustedBy?: string;
}
