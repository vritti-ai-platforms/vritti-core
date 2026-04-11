import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  manufacturingDate?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

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
