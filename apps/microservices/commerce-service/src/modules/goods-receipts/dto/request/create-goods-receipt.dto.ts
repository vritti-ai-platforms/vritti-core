import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsNotEmpty()
  @IsDateString()
  receivedDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
