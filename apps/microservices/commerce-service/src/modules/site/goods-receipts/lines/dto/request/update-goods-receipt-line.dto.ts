import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptLineDto {
  @IsUUID()
  goodsReceiptId: string;

  @IsUUID()
  itemId: string;

  @IsUUID()
  lineId: string;

  @IsOptional()
  @IsUUID()
  goodsReceiptLotId?: string | null;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
