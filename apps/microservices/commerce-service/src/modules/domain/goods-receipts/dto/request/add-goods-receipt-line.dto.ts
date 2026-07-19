import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptLineDto {
  @IsUUID()
  goodsReceiptId: string;

  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsUUID()
  goodsReceiptLotId?: string | null;

  @IsUUID()
  locationId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}
