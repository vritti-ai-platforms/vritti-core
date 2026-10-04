import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  purchaseOrderId?: string;

  @IsNotEmpty()
  @IsDateString()
  receivedDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
