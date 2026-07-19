import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptItemDto {
  @IsUUID()
  goodsReceiptId: string;

  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  orderedQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeBuyQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  schemeFreeQty?: number;

  @IsOptional()
  @IsBoolean()
  hasScheme?: boolean;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;
}
