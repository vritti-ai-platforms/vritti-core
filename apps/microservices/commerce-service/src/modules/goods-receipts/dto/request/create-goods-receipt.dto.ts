import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateGoodsReceiptItemDto {
  @IsUUID()
  purchaseOrderItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  acceptedQuantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  rejectedQuantity?: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  manufacturingDate?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsUUID()
  receivedBy?: string;

  @IsString()
  @IsNotEmpty()
  receivedDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}
