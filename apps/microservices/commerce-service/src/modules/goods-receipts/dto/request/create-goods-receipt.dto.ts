import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  receivedBy?: string;

  @IsNotEmpty()
  @IsDateString()
  receivedDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
