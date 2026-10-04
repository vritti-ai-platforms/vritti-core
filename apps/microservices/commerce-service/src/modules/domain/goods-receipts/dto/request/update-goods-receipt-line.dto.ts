import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptLineDto {
  @IsUUID('7')
  goodsReceiptId: string;

  @IsUUID('7')
  itemId: string;

  @IsUUID('7')
  lineId: string;

  @IsOptional()
  @IsUUID('7')
  goodsReceiptLotId?: string | null;

  @IsOptional()
  @IsUUID('7')
  locationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
