import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

}
