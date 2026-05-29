import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

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

  // Required when supplier currency differs from BU currency AND the rate isn't inherited from a
  // FIXED-rate PO. Service-layer validates per the create-GR rules and rejects with a clear error
  // if missing in the cases where it's needed.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
