import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptLineDto {
  @IsUUID('7')
  goodsReceiptId: string;

  @IsUUID('7')
  itemId: string;

  @IsOptional()
  @IsUUID('7')
  goodsReceiptLotId?: string | null;

  @IsUUID('7')
  locationId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}
